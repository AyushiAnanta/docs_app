import React, { useState } from 'react'
import { anticipate, motion, scale } from "motion/react";
import api from '../axios';
import Notification from '../components/Notification/Notification';

const FormComponent = ({login, setLogin, onLoginSuccess}) => {

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [notification, setNotification] = useState(null);

   const SaveIt = async () => {
  if (login) {
    if (!username && !email) {
      setNotification({ message: "Please enter your username or email.", type: 'error' });
      return;
    }
    if (!password) {
      setNotification({ message: "Please enter your password.", type: 'error' });
      return;
    }
    try {
      const res = await api.post('/api/v1/user/login', {
        username,
        email,
        password,
      });
      if (onLoginSuccess && res.data.data?.user) {
        onLoginSuccess(res.data.data.user);
      }
    } catch (error) {
      console.log('Login failed:', error.response?.data || error.message);
      const msg = error.response?.data?.message || "Login failed. Please check your credentials.";
      setNotification({ message: msg, type: 'error' });
    }
  } else {
    if (!email || !username || !password) {
      setNotification({ message: "Please fill in all required fields.", type: 'error' });
      return;
    }
    const formData = new FormData();
    formData.append('email', email);
    formData.append('username', username);
    formData.append('password', password);
    if (avatar) formData.append('avatar', avatar);

    try {
      const res = await api.post('/api/v1/user/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setNotification({ message: "Account created successfully! Please log in.", type: 'success' });
      setLogin(true);
    } catch (error) {
      console.error('Register failed:', error.response?.data || error.message);
      const msg = error.response?.data?.message || "Registration failed. Please try again.";
      setNotification({ message: msg, type: 'error' });
    }
  }
};

    

  return (
    <div className='w-full max-w-[400px] px-4 md:px-0 shrink-0'>
      <motion.div 
        initial={{ x: login ? -150 : 150 }}
        animate={{ x: 0 }}
        className='w-full min-h-[540px] py-8 bg-neutral-200 rounded-2xl flex flex-col items-center justify-center relative shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-neutral-300'
      >
        <h1 className='font-300 mb-5 text-3xl font-bold text-zinc-800'>{login?<>Welcome Again!</>:  <>Welcome!</>}</h1>
        <h5 className='font-300 mb-5 text-md font-thin text-zinc-500'>Enter your details here</h5>
        <input
          type="email"
          value={email}
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          className="w-4/5 p-2 mb-3 text-zinc-700 text-lg font-thin bg-neutral-200 placeholder:text-zinc-700 border-b border-b-[2px] border-[#D946EF]"
        />

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-4/5 p-2 mb-3 text-zinc-700 text-lg font-thin bg-neutral-200 placeholder:text-zinc-700 border-b border-b-[2px] border-[#D946EF]"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-4/5 p-2 mb-3 text-zinc-700  text-lg font-thin bg-neutral-200 placeholder:text-zinc-700 border-b border-b-[2px] border-[#D946EF]"
        />
        {!login && <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatar(e.target.files[0])}
          className="w-4/5 p-2 mb-3 text-zinc-700 text-lg font-thin bg-neutral-200 placeholder:text-zinc-700 border-b border-b-[2px] border-[#D946EF]"
        />}

        <div className="w-4/5 flex flex-row bg-neutral-800 justify-center items-center border border-fuchsia-500 rounded-full">
          <motion.button
            whileHover={{
              backgroundColor:'#C026D3'
            }}
            type="button"
            onClick={SaveIt}
            style={{backgroundColor: '#D946EF'}}
            className="w-full py-2 text-neutral-800  font-bold hover:bg-fuchsia-600 transition-all duration-200 rounded-3xl"
          >
            {login?<>Login</> : <>Sign Up</>}
          </motion.button>
        </div>

        <button
          type="button"
          onClick={() => setLogin(!login)}
          className="w-full mt-2 text-neutral-800 flex flex-row items-center justify-center bottom-0 absolute"
        >
          <h5 className='font-300 mb-5 text-sm font-thin mx-1'>{login?<>Don't have an account?</> : <>Have an account?</>}</h5>
          <h1 className='font-300 mb-5 text-xl top-6 font-bold'>{login?<>Sign Up!</> : <>Login!</>}</h1>
        </button>
      </motion.div>

      <Notification notification={notification} onClose={() => setNotification(null)} />
    </div>
  )
}

export default FormComponent