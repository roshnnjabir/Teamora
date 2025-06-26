// src/App.jsx
import AppRoutes from './routes/AppRoutes';
import useAuthBootstrap from './hooks/useAuthInit';

const App = () => {
    useAuthBootstrap(); // initialising auth from API on load before rendering

    return <AppRoutes />;
};

export default App;