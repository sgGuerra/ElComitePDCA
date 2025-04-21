import React from 'react';
import { FaBell, FaCog, FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Header = ({ activeTab, setActiveTab, tabs }) => {
  const navigate = useNavigate();

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'Procesos') {
      navigate('/procesos');
    } else if (tab === 'Resumen') {
      navigate('/dashboard');
    }
  };

  return (
    <header className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-6">
      <nav className="flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150 ${
              activeTab === tab ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="absolute left-1/2 transform -translate-x-1/2">
        <h1 className="text-3xl font-serif font-bold text-primary hidden md:block">El Comité</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button className="border border-primary text-primary px-3 py-1 rounded-md text-sm font-medium hover:bg-primary/10">
          Admin Panel
        </button>
        <div className="relative">
          <FaBell className="text-xl text-gray-600 hover:text-primary cursor-pointer" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white" />
        </div>
        <FaCog className="text-xl text-gray-600 hover:text-primary cursor-pointer" />
        <FaUserCircle className="text-3xl text-gray-400 hover:text-primary cursor-pointer" />
      </div>
    </header>
  );
};

export default Header;