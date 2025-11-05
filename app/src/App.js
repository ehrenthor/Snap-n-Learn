import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './Contexts/AuthContext';
import { ProtectedRoute } from './Common/ProtectedRoute';
import LandingPage from "./Boundary/LandingPage";
import ChildLogin from "./Boundary/Child/ChildLoginPage";
import ChildHomepage from "./Boundary/Child/ChildHomepage";
import ChildUploadImagePage from "./Boundary/Child/ChildUploadImagePage";
// import ChildProfile from "./Boundary/Child/ChildProfilePage";
import ChildUploadHistoryPage from "./Boundary/Child/ChildUploadHistoryPage";
import ChildHistoryDetailPage from "./Boundary/Child/ChildHistoryDetailPage";
import ChildQuizMainPage from "./Boundary/Child/ChildQuizMainPage";
import ChildQuizQuestionPage from "./Boundary/Child/ChildQuizQuestionPage";
import ChildQuizResultPage from "./Boundary/Child/ChildQuizResultPage";
import ChildQuizReviewPage from "./Boundary/Child/ChildQuizReviewPage";
import ChildChallengeMain from "./Boundary/Child/ChildChallengeMainPage";
import ChildChallengeQuestion from "./Boundary/Child/ChildChallengeQuestionPage";
import AdultLogin from "./Boundary/Adult/AdultLoginPage";
import RegisterAdult from "./Boundary/Adult/RegisterAdultPage";
import AdultRegisterChild from "./Boundary/Adult/AdultRegisterChildPage";
import AdultHomepage from "./Boundary/Adult/AdultHomepage";
import AdultStatisticsPage from "./Boundary/Adult/AdultStatisticsPage";
import AdultProfile from "./Boundary/Adult/AdultProfilePage";
import AdultEditChildAccountPage from './Boundary/Adult/AdultEditChildAccountPage';
import AdultJoinChildSession from './Boundary/Adult/AdultJoinChildSessionPage';
import AdultChildUploadHistoryList from './Boundary/Adult/AdultChildUploadHistoryListPage';
import AdultChildUploadHistoryDetail from './Boundary/Adult/AdultChildUploadHistoryDetailPage';
import AdultQuizMainPage from './Boundary/Adult/AdultQuizMainPage';
import AdultMakeQuizPage from './Boundary/Adult/AdultMakeQuizPage';
import AdultViewQuizPage from './Boundary/Adult/AdultViewQuizPage';
import AdultViewQuizTakenPage from './Boundary/Adult/AdultViewQuizTakenPage';
import AdminLogin from "./Boundary/Admin/AdminLoginPage";
import RegisterAdminPage from "./Boundary/Admin/RegisterAdminPage";
import AdminHomepage from "./Boundary/Admin/AdminHomePage";
import ViewUsers from "./Boundary/Admin/AdminViewUsers";
import UserStatistics from "./Boundary/Admin/AdminUserStatistics";
import AdminUserDetail from "./Boundary/Admin/AdminUserDetail";

function App() {

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage/>}/>
          <Route path="/childLogin" element={<ChildLogin/>}/>
          <Route path="/adultLogin" element={<AdultLogin/>}/>
          <Route path="/registerAdult" element={<RegisterAdult/>}/>
          <Route path="/admin" element={<AdminLogin />} />

          {/* Protected Child Routes */}
          <Route path="/childHomepage" element={<ProtectedRoute allowedRoles={['Child']}><ChildHomepage /></ProtectedRoute>} />
          <Route path="/childUploadImage" element={<ProtectedRoute allowedRoles={['Child']}><ChildUploadImagePage /></ProtectedRoute>} />
          {/* <Route path="/childProfile" element={<ProtectedRoute allowedRoles={['Child']}><ChildProfile/></ProtectedRoute>}/> */}
          <Route path="/childUploadHistory" element={<ProtectedRoute allowedRoles={['Child']}><ChildUploadHistoryPage/></ProtectedRoute>}/>
          <Route path="/childUploadHistory/:chatId" element={<ProtectedRoute allowedRoles={['Child']}><ChildHistoryDetailPage/></ProtectedRoute>}/>
          <Route path="/childQuizMain" element={<ProtectedRoute allowedRoles={['Child']}><ChildQuizMainPage/></ProtectedRoute>}/>
          <Route path="/childQuizQuestion" element={<ProtectedRoute allowedRoles={['Child']}><ChildQuizQuestionPage/></ProtectedRoute>}/>
          <Route path="/childQuizResult" element={<ProtectedRoute allowedRoles={['Child']}><ChildQuizResultPage/></ProtectedRoute>}/>
          <Route path="/childQuizReview" element={<ProtectedRoute allowedRoles={['Child']}><ChildQuizReviewPage/></ProtectedRoute>}/>
          <Route path="/childChallengeMain" element={<ProtectedRoute allowedRoles={['Child']}><ChildChallengeMain/></ProtectedRoute>}/>
          <Route path="/childChallengeQuestion/:chatId" element={<ProtectedRoute allowedRoles={['Child']}><ChildChallengeQuestion/></ProtectedRoute>}/>
          
          {/* Protected Adult Routes */}
          <Route path="/adultRegisterChild" element={<ProtectedRoute allowedRoles={['Adult']}><AdultRegisterChild/></ProtectedRoute>}/>
          <Route path="/adultHomepage" element={<ProtectedRoute allowedRoles={['Adult']}><AdultHomepage/></ProtectedRoute>}/>
          <Route path="/adult/statistics" element={<ProtectedRoute allowedRoles={['Adult']}><AdultStatisticsPage /></ProtectedRoute>} />
          {/* <Route path="/adultChildHomepage" element={<AdultChildHomepage/>}/> */}
          <Route path="/adultProfile" element={<ProtectedRoute allowedRoles={['Adult']}><AdultProfile/></ProtectedRoute>}/>
          {/* <Route path="/adultManageChildAccount" element={<AdultManageChildAccount/>}/> */}
          {/* <Route path="/childAccount/:username" element={<ChildAccount/>}/> */}
          {/* <Route path="/reset-password/:token" element={<ResetPasswordPage />} /> */}
          <Route path="/editChild/:username" element={<ProtectedRoute allowedRoles={['Adult']}><AdultEditChildAccountPage/></ProtectedRoute>}/>
          <Route path="/adultJoinChildSession" element={<ProtectedRoute allowedRoles={['Adult']}><AdultJoinChildSession /></ProtectedRoute>} />
          {/* <Route path="/adultChildUploadHistory" element={<AdultChildUploadHistory/>}/> */}
          <Route path="/adultChildUploadHistory/:username" element={<ProtectedRoute allowedRoles={['Adult']}><AdultChildUploadHistoryList/></ProtectedRoute>}/>
          <Route path="/adultChildUploadHistory/:username/:chatId" element={<ProtectedRoute allowedRoles={['Adult']}><AdultChildUploadHistoryDetail/></ProtectedRoute>}/>
          <Route path="/adultQuizMain" element={<ProtectedRoute allowedRoles={['Adult']}><AdultQuizMainPage/></ProtectedRoute>}/>
          <Route path="/adultMakeQuiz" element={<ProtectedRoute allowedRoles={['Adult']}><AdultMakeQuizPage/></ProtectedRoute>}/>
          <Route path="/adultViewQuiz" element={<ProtectedRoute allowedRoles={['Adult']}><AdultViewQuizPage/></ProtectedRoute>}/>
          <Route path="/adultViewQuizTaken" element={<ProtectedRoute allowedRoles={['Adult']}><AdultViewQuizTakenPage/></ProtectedRoute>}/>

          {/* Protected Admin Routes */}
          <Route path="/registerAdmin" element={<ProtectedRoute allowedRoles={['Admin']}><RegisterAdminPage /></ProtectedRoute>}/>
          <Route path="/adminHomepage" element={<ProtectedRoute allowedRoles={['Admin']}><AdminHomepage /></ProtectedRoute>} />
          <Route path="/viewUsers" element={<ProtectedRoute allowedRoles={['Admin']}><ViewUsers /></ProtectedRoute>} />
          <Route path="/userStatistics" element={<ProtectedRoute allowedRoles={['Admin']}><UserStatistics /></ProtectedRoute>} />
          <Route path="/admin/view-user/:userId" element={<ProtectedRoute allowedRoles={['Admin']}><AdminUserDetail /></ProtectedRoute>} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;