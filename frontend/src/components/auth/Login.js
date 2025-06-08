import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/api/auth/login', {
                email,
                code
            });

            // Stocker le token dans le localStorage
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Rediriger selon le rôle
            const role = response.data.user.role;
            switch(role) {
                case 'admin':
                    navigate('/admin/dashboard');
                    break;
                case 'doctor':
                    navigate('/doctor/dashboard');
                    break;
                case 'patient':
                    navigate('/patient/dashboard');
                    break;
                default:
                    navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const handleResetCode = async () => {
        if (!email) {
            setError('Veuillez entrer votre email');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/auth/reset-code', { email });
            setError('');
            alert('Un nouveau code a été envoyé à votre email');
        } catch (err) {
            setError(err.response?.data?.error || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Connexion
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="code" className="sr-only">Code</label>
                            <input
                                id="code"
                                name="code"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Code à 6 chiffres"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                maxLength={6}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleResetCode}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                            disabled={loading}
                        >
                            Obtenir un nouveau code
                        </button>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {loading ? 'Connexion en cours...' : 'Se connecter'}
                        </button>
                    </div>
                    <div className="text-center mt-4">
                        <Link to="/register" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            Pas encore de compte ? S'inscrire
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login; 