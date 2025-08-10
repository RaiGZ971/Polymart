import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { NavigationBar, Footer, Textfield, PasswordField } from '@/components';
import { stall } from '@/assets';
import { postLogin } from './queries/signInQueries';
import { useAuthStore } from '../../store/authStore.js';
import { UserService } from '../../services/userService.js';

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ studentId: '', password: '' });
  const [error, setError] = useState('');

  const { setUser } = useAuthStore();
  const { mutateAsync, isLoading: loading } = postLogin();

  // Handle redirect messages
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) setError(decodeURIComponent(message));
  }, [searchParams]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.studentId || !form.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const userData = await mutateAsync({
        student_number: form.studentId,
        password: form.password,
      });

      // Set basic auth data first
      setUser(userData.data.user.user_id, userData.data.access_token);
      
      // Set immediate username from token data as fallback
      try {
        const tokenUser = UserService.getCurrentUser(userData.data.access_token);
        if (tokenUser && tokenUser.username) {
          const { setUserProfile } = useAuthStore.getState();
          setUserProfile({ username: tokenUser.username });
        }
      } catch (tokenError) {
        console.warn('Could not extract username from token:', tokenError);
      }
      
      // Fetch and store detailed user profile for first name
      try {
        const userProfile = await UserService.getUserProfile(userData.data.user.user_id);
        const { setUserProfile } = useAuthStore.getState();
        setUserProfile(userProfile.data);
      } catch (profileError) {
        console.warn('Failed to fetch user profile during login:', profileError);
      }

      navigate('/dashboard');
    } catch (error) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        'Login failed. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center font-montserrat">
      <div className="w-full p-10 px-0 mx-0">
        <NavigationBar />
      </div>

      <div className="w-full flex items-center justify-center px-8 pt-10 pb-20 gap-16">
        <div className="max-w-[420px] -ml-12">
          <img src={stall} alt="Stall" className="w-full h-auto" />
        </div>

        <div className="max-w-[420px] flex flex-col items-center">
          <div className="border-2 border-primary-red rounded-[30px] p-10 shadow-lg w-full space-y-3">
            <div className="space-y-0 mb-8">
              <h1 className="text-3xl font-bold text-primary-red">
                Kamusta, Iskolar?
              </h1>
              <p className="text-sm">Sa PolyMart lahat ng Isko, may pwesto!</p>
            </div>

            <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
              <Textfield
                label="Student ID"
                name="studentId"
                type="text"
                value={form.studentId}
                onChange={handleChange}
                required
              />

              <PasswordField
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                showValidation={false}
                required
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <a
                href="/forgot-password"
                className="text-gray-500 hover:underline text-xs text-right"
              >
                Forgot Password?
              </a>

              <button
                type="submit"
                disabled={loading}
                className="bg-hover-red text-white rounded-[30px] px-2 py-3 shadow-sm font-semibold hover:bg-secondary-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="flex items-center space-x-4">
                <hr className="flex-1 border-gray-300" />
                <p className="text-gray-500 text-xs">or continue with</p>
                <hr className="flex-1 border-gray-300" />
              </div>

              <button
                type="button"
                className="bg-white border-2 border-primary-red text-primary-red rounded-[30px] font-semibold p-2 hover:bg-hover-red hover:text-white transition-colors"
              >
                Continue with Google
              </button>

              <p className="text-xs text-gray-500">
                Not part of the community yet?{' '}
                <a href="/signup" className="text-primary-red hover:underline">
                  Sign Up
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
      <Footer variant="dark" className="w-full" />
    </div>
  );
}
