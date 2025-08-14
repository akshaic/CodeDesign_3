import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PostDashboard from './components/PostDashboard';
import PostForm from './components/PostForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PostDashboard />} />
        <Route path="/editor" element={<PostForm />} />
        <Route path="/editor/:id" element={<PostForm />} />
      </Routes>
    </Router>
  );
}

export default App;
