import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./Boundary/LandingPage";
import ChildLogin from "./Boundary/Child/ChildLoginPage";
import ChildHomepage from "./Boundary/Child/ChildHomepage";
import ChildUploadImagePage from "./Boundary/Child/ChildUploadImagePage";
import ChildProfile from "./Boundary/Child/ChildProfilePage";
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
// import AdultChildHomepage from "./Boundary/Adult/AdultChildHomepage";
import AdultProfile from "./Boundary/Adult/AdultProfilePage";
// import AdultManageChildAccount from "./Boundary/Adult/AdultManageChildAccountPage";
// import ChildAccount from './Boundary/Not Important/ChildAccount';
// import ResetPasswordPage from "./Boundary/Adult/AdultChildResetPasswordPage";
import AdultEditChildAccountPage from './Boundary/Adult/AdultEditChildAccountPage';
import AdultJoinChildSession from './Boundary/Adult/AdultJoinChildSessionPage';
// import AdultChildUploadHistory from './Boundary/Adult/AdultChildUploadHistoryPage';
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

import UploadPage from './Test/UploadPage';
import DetailPage from './Test/DetailPage';


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/childLogin" element={<ChildLogin/>}/>
        <Route path="/childHomepage" element={<ChildHomepage />} />
        <Route path="/childUploadImage" element={<ChildUploadImagePage />} />
        <Route path="/childProfile" element={<ChildProfile/>}/>
        <Route path="/childUploadHistory" element={<ChildUploadHistoryPage/>}/>
        <Route path="/childUploadHistory/:chatId" element={<ChildHistoryDetailPage/>}/>
        <Route path="/childQuizMain" element={<ChildQuizMainPage/>}/>
        <Route path="/childQuizQuestion" element={<ChildQuizQuestionPage/>}/>
        <Route path="/childQuizResult" element={<ChildQuizResultPage/>}/>
        <Route path="/childQuizReview" element={<ChildQuizReviewPage/>}/>
        <Route path="/childChallengeMain" element={<ChildChallengeMain/>}/>
        <Route path="/childChallengeQuestion/:chatId" element={<ChildChallengeQuestion/>}/>
        <Route path="/adultLogin" element={<AdultLogin/>}/>
        <Route path="/registerAdult" element={<RegisterAdult/>}/>
        <Route path="/adultRegisterChild" element={<AdultRegisterChild/>}/>
        <Route path="/adultHomepage" element={<AdultHomepage/>}/>
        <Route path="/adult/statistics" element={<AdultStatisticsPage />} />
        {/* <Route path="/adultChildHomepage" element={<AdultChildHomepage/>}/> */}
        <Route path="/adultProfile" element={<AdultProfile/>}/>
        {/* <Route path="/adultManageChildAccount" element={<AdultManageChildAccount/>}/> */}
        {/* <Route path="/childAccount/:username" element={<ChildAccount/>}/> */}
        {/* <Route path="/reset-password/:token" element={<ResetPasswordPage />} /> */}
        <Route path="/editChild/:username" element={<AdultEditChildAccountPage/>}/>
        <Route path="/adultJoinChildSession" element={<AdultJoinChildSession />} />
        {/* <Route path="/adultChildUploadHistory" element={<AdultChildUploadHistory/>}/> */}
        <Route path="/adultChildUploadHistory/:username" element={<AdultChildUploadHistoryList/>}/>
        <Route path="/adultChildUploadHistory/:username/:chatId" element={<AdultChildUploadHistoryDetail/>}/>
        <Route path="/adultQuizMain" element={<AdultQuizMainPage/>}/>
        <Route path="/adultMakeQuiz" element={<AdultMakeQuizPage/>}/>
        <Route path="/adultViewQuiz" element={<AdultViewQuizPage/>}/>
        <Route path="/adultViewQuizTaken" element={<AdultViewQuizTakenPage/>}/>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/registerAdmin" element={<RegisterAdminPage />}/>
        <Route path="/adminHomepage" element={<AdminHomepage />} />
        <Route path="/viewUsers" element={<ViewUsers />} />
        <Route path="/userStatistics" element={<UserStatistics />} />


        {/* Test routes */}
        <Route path="/test/new" element={<UploadPage />} />
        <Route path="/test/:uuid" element={<DetailPage />} />
        {/* <Route path="/test/child" element={<TestChild />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;