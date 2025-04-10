import React, { useState } from 'react';
import { FaMicrosoft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      console.error("Please enter both email and password.");
      return;
    }
    console.log('Attempting login with:', { email, password, remember });
    console.log('Login successful! Redirecting to dashboard...');
    navigate('/dashboard');
  };

  const handleMicrosoftLogin = (e) => {
    e.preventDefault();
    console.log('Attempting Microsoft login...');
    console.log('Microsoft login clicked (implementation pending).');
  };

  return (
    <div className="min-h-screen bg-white text-primary flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <h1 className="text-6xl md:text-7xl font-serif font-semibold text-primary">
            El Comité
          </h1>
          <p className="mt-2 text-lg font-semibold text-primary">
            Sistema de mejoramiento continuo
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <input type="hidden" name="remember" value={remember.toString()} />
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">Correo electrónico</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm bg-lightgray"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm bg-lightgray"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary/80 border-gray-300 rounded"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Recordar cuenta
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-primary hover:text-primary/80">
                ¿Olvidaste la contraseña?
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                navigate('/dashboard');
              }}
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/80"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={handleMicrosoftLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-primary text-sm font-medium rounded-md text-primary bg-white hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/80"
            >
              <FaMicrosoft className="mr-2 h-5 w-5" aria-hidden="true" />
              Iniciar Sesión con Microsoft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
