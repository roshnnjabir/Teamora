import AppRoutes from './routes/AppRoutes';
import NotificationListener from './domains/notifications/NotificationListener';

const App = () => {
  return (
    <>
      <NotificationListener />
      <AppRoutes />
    </>
  );
};

export default App;