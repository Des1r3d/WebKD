import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, UserStatus, type User } from '../types';

export interface ReputationSummary {
  score: number;
  tier: 'A' | 'B' | 'C' | 'FLAGGED';
  depositPercent: number;
  canJoinLobby: boolean;
  tierLabel: string;
  depositRuleText: string;
}

export function computeReputation(score: number): ReputationSummary {
  if (score >= 90) {
    return {
      score,
      tier: 'A',
      depositPercent: 0,
      canJoinLobby: true,
      tierLabel: 'Hạng A · Uy tín cao',
      depositRuleText: 'Miễn cọc (0% phần tiền sân)',
    };
  }
  if (score >= 70) {
    return {
      score,
      tier: 'B',
      depositPercent: 30,
      canJoinLobby: true,
      tierLabel: 'Hạng B · Tiêu chuẩn',
      depositRuleText: 'Cọc 30% phần tiền sân',
    };
  }
  if (score >= 50) {
    return {
      score,
      tier: 'C',
      depositPercent: 100,
      canJoinLobby: true,
      tierLabel: 'Hạng C · Cảnh báo',
      depositRuleText: 'Cọc 100% phần tiền sân',
    };
  }
  return {
    score,
    tier: 'FLAGGED',
    depositPercent: 100,
    canJoinLobby: false,
    tierLabel: 'FLAGGED · Vi phạm / Bùng kèo',
    depositRuleText: 'Bị hệ thống từ chối cho vào phòng (BR-REP-01)',
  };
}

export const TEST_ACCOUNTS: (User & { description: string })[] = [
  {
    id: 'usr-host-01',
    email: 'dat.dt@synchub.vn',
    full_name: 'Đào Tiến Đạt (Host)',
    phone: '0901234567',
    role: Role.HOST,
    reputation_score: 98,
    status: UserStatus.ACTIVE,
    description: 'Trưởng nhóm · Hạng A (98đ) · Miễn cọc 0%',
  },
  {
    id: 'usr-mem-02',
    email: 'minh.b@synchub.vn',
    full_name: 'Trần Quang Minh (Member B)',
    phone: '0902234567',
    role: Role.MEMBER,
    reputation_score: 82,
    status: UserStatus.ACTIVE,
    description: 'Thành viên · Hạng B (82đ) · Cọc 30%',
  },
  {
    id: 'usr-mem-03',
    email: 'linh.c@synchub.vn',
    full_name: 'Lê Hoàng Linh (Member C)',
    phone: '0903234567',
    role: Role.MEMBER,
    reputation_score: 64,
    status: UserStatus.ACTIVE,
    description: 'Thành viên · Hạng C (64đ) · Cọc 100%',
  },
  {
    id: 'usr-flag-05',
    email: 'hung.flag@synchub.vn',
    full_name: 'Phạm Gia Hưng (Flagged)',
    phone: '0905234567',
    role: Role.MEMBER,
    reputation_score: 42,
    status: UserStatus.FLAGGED,
    description: 'Bị gắn cờ · Dưới 50đ (42đ) · Chặn vào phòng',
  },
  {
    id: 'usr-prv-01',
    email: 'clb.nvh@synchub.vn',
    full_name: 'CLB Cầu Lông NVH SV (Chủ sân)',
    phone: '0908889999',
    role: Role.PROVIDER,
    reputation_score: 99,
    status: UserStatus.ACTIVE,
    description: 'Đối tác Cung cấp · Quyền quản lý sân & món',
  },
  {
    id: 'usr-adm-01',
    email: 'admin@synchub.vn',
    full_name: 'Ban Quản Trị SyncHub (Admin)',
    phone: '0909990000',
    role: Role.ADMIN,
    reputation_score: 100,
    status: UserStatus.ACTIVE,
    description: 'Quản trị viên · Xử lý khiếu nại, đối soát Escrow',
  },
];

interface AuthContextType {
  currentUser: User;
  reputation: ReputationSummary;
  token: string;
  switchAccount: (userId: string) => void;
  switchRole: (role: Role) => void;
  updateScore: (newScore: number) => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('synchub_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return TEST_ACCOUNTS[0];
  });

  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('synchub_token') || 'jwt_host_usr-host-01';
  });

  useEffect(() => {
    localStorage.setItem('synchub_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const reputation = computeReputation(currentUser.reputation_score);

  const switchAccount = (userId: string) => {
    const acc = TEST_ACCOUNTS.find((a) => a.id === userId);
    if (acc) {
      setCurrentUser(acc);
      const generatedToken = `jwt_${acc.role.toLowerCase()}_${acc.id}`;
      setToken(generatedToken);
      localStorage.setItem('synchub_token', generatedToken);
    }
  };

  const switchRole = (role: Role) => {
    const acc = TEST_ACCOUNTS.find((a) => a.role === role);
    if (acc) {
      switchAccount(acc.id);
    } else {
      setCurrentUser((prev) => ({ ...prev, role }));
    }
  };

  const updateScore = (newScore: number) => {
    const clamped = Math.max(0, Math.min(100, newScore));
    setCurrentUser((prev) => ({
      ...prev,
      reputation_score: clamped,
      status: clamped < 50 ? UserStatus.FLAGGED : UserStatus.ACTIVE,
    }));
  };

  const hasRole = (...roles: Role[]): boolean => {
    return roles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        reputation,
        token,
        switchAccount,
        switchRole,
        updateScore,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
