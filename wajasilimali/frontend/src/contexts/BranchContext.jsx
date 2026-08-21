import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { branchesAPI } from '../services/api';
import { useAuth } from './AuthContext';

const BranchContext = createContext(null);
const KEY = 'wajasilimali_branch_id';

export function BranchProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchIdState] = useState(() => {
    const v = localStorage.getItem(KEY);
    return v ? Number(v) : null;
  });
  const [loading, setLoading] = useState(false);

  const setBranchId = useCallback((id) => {
    const num = id == null ? null : Number(id);
    setBranchIdState(num);
    if (num != null) {
      localStorage.setItem(KEY, String(num));
    } else {
      localStorage.removeItem(KEY);
    }
    window.dispatchEvent(
      new CustomEvent('wajasilimali-branch-changed', { detail: { branchId: num } })
    );
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setBranches([]);
      return;
    }
    setLoading(true);
    try {
      const res = await branchesAPI.list();
      const list = res.data || [];
      setBranches(list);

      const saved = localStorage.getItem(KEY);
      const savedNum = saved ? Number(saved) : null;
      const stillExists = savedNum && list.some((b) => b.id === savedNum);

      if (stillExists) {
        setBranchIdState(savedNum);
      } else if (list.length > 0) {
        const first = list[0].id;
        setBranchIdState(first);
        localStorage.setItem(KEY, String(first));
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const current = branches.find((b) => b.id === branchId) || null;

  return (
    <BranchContext.Provider
      value={{
        branches,
        branchId,
        setBranchId,
        current,
        loading,
        refresh,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch within BranchProvider');
  return ctx;
}
