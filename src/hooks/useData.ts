import { useDataContext } from '../context/DataContext';

export const useData = () => {
  return useDataContext();
};

export const useSubscribers = () => {
  const { subscribers, setSubscribers, isLoading, isSyncing, persistSubscriber, removeSubscriberFromDb } = useDataContext();
  return {
    subscribers,
    setSubscribers,
    isLoading,
    isSyncing,
    persistSubscriber,
    removeSubscriberFromDb,
  };
};
