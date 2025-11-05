import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  format,
  parse,
  startOfWeek,
  startOfMonth,
  addDays,
  subDays,
  eachDayOfInterval,
  getWeek,
  getMonth,
  getYear,
  formatISO
} from 'date-fns';
import Cookies from 'js-cookie';
import Header from '../../Component/AdultHeader';
import './AdultStatisticsPage.css';

const apiUrl = process.env.REACT_APP_API_URL;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const formatDate = (date) => format(date, 'yyyy-MM-dd');

const AdultStatisticsPage = () => {
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [statsData, setStatsData] = useState({}); // Store raw daily stats per child { childId: { YYYYMMDD: count, ... }, ... }
  const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    // Default to last 30 days
    const endDate = new Date();
    const startDate = subDays(endDate, 29);
    return { startDate, endDate };
  });

  const navigate = useNavigate();
  const username = Cookies.get("username");

  useEffect(() => {
    const fetchChildrenData = async () => {
      if (!username) {
        navigate('/adultLogin');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiUrl}/users/getChildren`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
          credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
          setChildren(data);
          if (data.length > 0) {
            setActiveChildId(data[0].userId);
          } else {
            setLoading(false);
          }
        } else {
          setError(data.error || 'Error fetching children data');
          setLoading(false);
        }
      } catch (error) {
        setError('Network error fetching children data');
        console.error("Network error fetching children data:", error);
        setLoading(false);
      }
    };
    fetchChildrenData();
  }, [username, navigate]);

  // Fetch stats when active child or date range changes
  useEffect(() => {
    const fetchStats = async () => {
      if (!activeChildId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiUrl}/stats/${activeChildId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dateStart: formatDate(dateRange.startDate),
            dateEnd: formatDate(dateRange.endDate),
          }),
          credentials: 'include'
        });
        const data = await response.json();

        if (response.ok) {
          setStatsData(prev => ({ ...prev, [activeChildId]: data }));
        } else {
          setError(data.error || `Failed to fetch stats for child ${activeChildId}`);
        }
      } catch (err) {
        setError(`Network error fetching stats for child ${activeChildId}`);
        console.error(`Network error fetching stats for child ${activeChildId}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [activeChildId, dateRange.startDate, dateRange.endDate]); // Re-fetch if child or dates change

  // Memoize processed data for the chart to avoid recalculation on every render
  const processedChartData = useMemo(() => {
    if (!activeChildId || !statsData[activeChildId]) {
      return { labels: [], datasets: [] };
    }

    const dailyStats = statsData[activeChildId]; // { YYYYMMDD: count, ... }
    const allDatesInRange = eachDayOfInterval({ start: dateRange.startDate, end: dateRange.endDate });

    let labels = [];
    let data = [];

    if (viewMode === 'daily') {
      labels = allDatesInRange.map(date => format(date, 'yyyy-MM-dd'));
      data = allDatesInRange.map(date => {
        const dateKey = format(date, 'yyyyMMdd');
        return dailyStats[dateKey] || 0;
      });
    } else if (viewMode === 'weekly') {
      const weeklyTotals = {}; // { 'YYYY-WW': count }
      allDatesInRange.forEach(date => {
        const weekStartDate = startOfWeek(date, { weekStartsOn: 1 }); // Monday as start of week
        const weekKey = format(weekStartDate, 'yyyy-MM-dd'); // Label week by its start date
        const dateKey = format(date, 'yyyyMMdd');
        if (!weeklyTotals[weekKey]) {
          weeklyTotals[weekKey] = 0;
        }
        weeklyTotals[weekKey] += (dailyStats[dateKey] || 0);
      });
      // Ensure weeks are sorted chronologically
      labels = Object.keys(weeklyTotals).sort();
      data = labels.map(label => weeklyTotals[label]);
      labels = labels.map(label => `Week of ${label}`);

    } else if (viewMode === 'monthly') {
      const monthlyTotals = {}; // { 'YYYY-MM': count }
      allDatesInRange.forEach(date => {
        const monthKey = format(date, 'yyyy-MM');
        const dateKey = format(date, 'yyyyMMdd');
        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = 0;
        }
        monthlyTotals[monthKey] += (dailyStats[dateKey] || 0);
      });
      // Ensure months are sorted chronologically
      labels = Object.keys(monthlyTotals).sort();
      data = labels.map(label => monthlyTotals[label]);
      labels = labels.map(label => format(parse(label, 'yyyy-MM', new Date()), 'MMMM yyyy'));
    }

    return {
      labels,
      datasets: [
        {
          label: 'Images Uploaded',
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [activeChildId, statsData, viewMode, dateRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Image Uploads - ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View`,
      },
      tooltip: {
        callbacks: {
          title: function (tooltipItems) {
            const label = tooltipItems[0].label;
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Images',
        },
        ticks: {
          // Show integer values only
          stepSize: 1,
          precision: 0
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time Period',
        },
      },
    },
  };

  const activeChildUsername = children.find(c => c.userId === activeChildId)?.username || 'N/A';

  return (
    <div className="stats-page-container">
      <Header/>
      <div className="stats-content">
        <h1>Child Statistics</h1>
        <button
          onClick={() => navigate('/adultHomepage')}
          className="adultHomepage-back-button"
        >
          Dashboard
        </button>
        {children.length === 0 && !loading && <p>No children found for this account.</p>}
        {children.length > 0 && (
          <>
            <div className="stats-tabs">
              {children.map(child => (
                <button
                  key={child.userId}
                  className={`stats-tab ${activeChildId === child.userId ? 'active' : ''}`}
                  onClick={() => setActiveChildId(child.userId)}
                >
                  {child.username}
                </button>
              ))}
            </div>

            <div className="stats-controls">
              <span className="date-range-display">
                 Data from {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
               </span>
              <div className="view-mode-selector">
                <button onClick={() => setViewMode('daily')} className={viewMode === 'daily' ? 'active' : ''}>Daily
                </button>
                <button onClick={() => setViewMode('weekly')} className={viewMode === 'weekly' ? 'active' : ''}>Weekly
                </button>
                <button onClick={() => setViewMode('monthly')}
                        className={viewMode === 'monthly' ? 'active' : ''}>Monthly
                </button>
              </div>
            </div>

            {loading && <p className="loading-message">Loading statistics for {activeChildUsername}...</p>}
            {error && <p className="error-message">Error: {error}</p>}

            {!loading && !error && activeChildId && statsData[activeChildId] && (
              <div className="chart-container">
                <h2>{activeChildUsername}'s Uploads</h2>
                <Bar options={chartOptions} data={processedChartData}/>
              </div>
            )}
            {!loading && !error && activeChildId && !statsData[activeChildId] && (
              <p>No statistics data found for {activeChildUsername} in the selected range.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdultStatisticsPage;