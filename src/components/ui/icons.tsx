import type { SVGProps } from "react";

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MicrosoftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <rect x="1" y="1" width="10" height="10" fill="currentColor" />
      <rect x="13" y="1" width="10" height="10" fill="currentColor" />
      <rect x="1" y="13" width="10" height="10" fill="currentColor" />
      <rect x="13" y="13" width="10" height="10" fill="currentColor" />
    </svg>
  );
}

export function AppleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        d="M16.2 2.2c-.8.9-1.4 2.1-1.2 3.4 1.1.1 2.2-.5 3-1.4.7-.9 1.3-2.1 1.1-3.3-1.1-.1-2.2.5-2.9 1.3z"
        fill="currentColor"
      />
      <path
        d="M20.1 14.2c-.2 3.1 2.5 4.1 2.5 4.1s-1.9 5.5-4.6 5.5c-1.2 0-2.1-.8-3.4-.8-1.3 0-2.3.8-3.5.8-2.4 0-5.3-5.2-5.3-9.4 0-3.3 2.1-5 4.1-5 1.2 0 2.3.8 3.1.8.8 0 2.1-.9 3.6-.9.6 0 2.6.1 3.8 2.1-2.9 1.6-2.4 4.6-.3 5.8z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * FIDO Alliance Passkey Icon
 * Standard icon for passkey/WebAuthn authentication
 * Based on the official FIDO Alliance design guidelines
 */
export function PasskeyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Person/head */}
      <circle cx="10" cy="7" r="4" />
      {/* Body */}
      <path d="M10 21v-4" />
      <path d="M10 13c-4 0-6 2-6 4v4h8" />
      {/* Key */}
      <circle cx="18" cy="16" r="3" />
      <path d="M18 19v3" />
      <path d="M16 21h4" />
    </svg>
  );
}

// Re-export commonly used Lucide icons for consistency
export {
  AlertCircle,
  ArrowLeft as ArrowLeftIcon,
  Calendar,
  Calendar as CalendarIcon,
  CheckCircle2,
  Check as CheckIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
  Clock,
  CreditCard,
  Download as DownloadIcon,
  Link as LinkIcon,
  Loader2,
  LoaderCircle as LoaderIcon,
  GalleryVerticalEnd as LogoIcon,
  MapPin as MapPinIcon,
  MoonIcon,
  Palette as PaletteIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  SunIcon,
  Trophy,
  User,
  UserPlus,
  Users,
  Users as UsersIcon,
  XCircle,
} from "lucide-react";
