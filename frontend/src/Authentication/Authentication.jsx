import React, { useState } from 'react';
import LogoComponent from './LogoComponent';
import FormComponent from './FormComponent';

const Authentication = ({ onLoginSuccess }) => {
  const [login, setLogin] = useState(true); // else Signup

  return (
    <div id='auth' className="min-h-screen w-screen flex flex-col md:flex-row items-center justify-center bg-[#27272a] overflow-y-auto p-6 md:p-0">
      {login ? (
        <>
          {/* Form wrapper */}
          <div className="flex-1 w-full flex flex-col justify-center items-center z-10">
            {/* Logo shown above form on mobile/tablet only */}
            <h1 className="text-5xl font-bold text-zinc-100 mb-6 md:hidden">docs.</h1>
            <FormComponent login={login} setLogin={setLogin} onLoginSuccess={onLoginSuccess} />
          </div>

          {/* Logo panel shown on desktop only */}
          <div className="hidden md:block h-full flex-1 mr-10">
            <LogoComponent login={login} />
          </div>
        </>
      ) : (
        <>
          {/* Logo panel shown on desktop only */}
          <div className="hidden md:block h-full flex-1 ml-10">
            <LogoComponent login={login} />
          </div>

          {/* Form wrapper */}
          <div className="flex-1 w-full flex flex-col justify-center items-center z-10">
            <h1 className="text-5xl font-bold text-zinc-100 mb-6 md:hidden">docs.</h1>
            <FormComponent login={login} setLogin={setLogin} onLoginSuccess={onLoginSuccess} />
          </div>
        </>
      )}
    </div>
  );
};

export default Authentication;
