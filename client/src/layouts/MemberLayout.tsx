import { Shell } from './Shell';

const nav = [
  { to: '/', label: 'Khám phá' },
  { to: '/wallet', label: 'Ví' },
  { to: '/disputes', label: 'Khiếu nại' },
  { to: '/profile', label: 'Hồ sơ' },
];
export const MemberLayout = () => <Shell nav={nav} bottomNav />;
