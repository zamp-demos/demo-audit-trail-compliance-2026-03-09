import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import DashboardLayout from "./components/DashboardLayout";
import ProcessList from "./components/ProcessList";
import ProcessDetails from "./components/ProcessDetails";
import KnowledgeBase from "./components/KnowledgeBase";
import People from "./components/People";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/done" element={<DashboardLayout />}>
          <Route
            index
            element={<ProcessList category="audit-trail-compliance" label="Audit Trail Compliance" />}
          />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="people" element={<People />} />
          <Route
            path="process/:id"
            element={<ProcessDetails category="audit-trail-compliance" />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
