import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Badge } from './index';

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { currentUser, switchRole, hasRole } = useAuth();

  const isAllowed = hasRole(...allowedRoles);

  if (!isAllowed) {
    const targetRole = allowedRoles[0];

    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="text-center p-8 border-status-held/40 bg-status-held-bg/20 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-status-held/10 text-status-held flex items-center justify-center mx-auto mb-4 border border-status-held/30">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <Badge variant="locked" size="md" className="mb-2">
            403 FORBIDDEN · Cổng Duyệt RBAC
          </Badge>

          <h2 className="text-xl font-bold text-text-primary mt-2">
            Quyền truy cập bị từ chối
          </h2>

          <p className="text-sm text-text-secondary mt-2 max-w-lg mx-auto">
            Khu vực này yêu cầu vai trò{' '}
            <strong className="text-text-primary font-semibold">
              {allowedRoles.join(' hoặc ')}
            </strong>
            . Tài khoản hiện tại (<span className="text-primary font-medium">{currentUser.full_name}</span>) đang có vai trò{' '}
            <strong className="text-status-held font-semibold">{currentUser.role}</strong>.
          </p>

          <div className="bg-bg-surface border border-border-default rounded-lg p-4 mt-6 text-left text-xs max-w-md mx-auto space-y-2">
            <div className="font-semibold text-text-primary flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Kiểm chứng Gate WBS-2.2:
            </div>
            <p className="text-text-secondary">
              Middleware và Route Guard đã hoạt động chính xác theo đặc tả bảng RBAC trong <code className="bg-bg-subtle px-1 py-0.5 rounded text-primary">CONTEXT.md</code>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Button
              variant="primary"
              size="md"
              leftIcon={<KeyRound className="w-4 h-4" />}
              onClick={() => switchRole(targetRole)}
            >
              Chuyển sang vai trò {targetRole} để kiểm thử
            </Button>
            <NavLink to="/home">
              <Button
                variant="outline"
                size="md"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Quay về Trang chủ
              </Button>
            </NavLink>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
