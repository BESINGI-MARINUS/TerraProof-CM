// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout      from './components/Layout';
import Dashboard   from './pages/Dashboard';
import SearchTitle from './pages/SearchTitle';
import RegisterLand from './pages/RegisterLand';
import ApproveLand from './pages/ApproveLand';
import RequestTransfer from './pages/RequestTransfer';
import AuditTrail  from './pages/AuditTrail';
import DisputeReject from './pages/DisputeReject';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"          element={<Dashboard />}       />
          <Route path="/search"    element={<SearchTitle />}     />
          <Route path="/register"  element={<RegisterLand />}    />
          <Route path="/approve"   element={<ApproveLand />}     />
          <Route path="/transfer"  element={<RequestTransfer />} />
          <Route path="/audit"     element={<AuditTrail />}      />
          <Route path="/dispute"   element={<DisputeReject />}   />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
