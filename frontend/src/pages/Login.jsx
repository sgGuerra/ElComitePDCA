import { useState } from 'react';
import { FaMicrosoft } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleLogin = () => {
    // lógica para iniciar sesión
  };

  return (
    <div className="min-h-screen bg-white text-[#143261] flex items-center px-16">
      <div className="max-w-sm w-full">
        <h1 className="text-[96px] font-serif font-semibold leading-none tracking-tight">
          El Comité
        </h1>
        <p className="text-lg font-semibold mt-2">
          Sistema de mejoramiento continuo
        </p>

        <div className="mt-10 space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-[#F1F3F7] rounded-md focus:outline-none"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-[#F1F3F7] rounded-md focus:outline-none"
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Recordar cuenta</span>
            </label>
            <a href="#" className="text-[#143261] hover:underline">
              Olvidaste la contraseña
            </a>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-[#143261] hover:bg-[#102748] text-white py-2 rounded-md"
          >
            Iniciar Sesión
          </button>

          <button className="w-full border border-[#143261] text-[#143261] py-2 rounded-md flex items-center justify-center space-x-2 hover:bg-[#f0f4f9]">
            <FaMicrosoft />
            <span>Iniciar Sesión con Microsoft</span>
          </button>
        </div>
      </div>
    </div>
  );
}
