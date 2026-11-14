import {
  LayoutDashboard, Users, CalendarDays, Wallet, TrendingUp, MessageSquare, ShieldAlert, BadgeCheck,
} from 'lucide-react'

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/safety', label: 'Safety', icon: ShieldAlert },
  { href: '/verification', label: 'Host ID', icon: BadgeCheck },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/feedback', label: 'Feedback', icon: MessageSquare },
] as const
