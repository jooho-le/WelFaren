import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function SvgIcon({ size = 20, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconHome(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4.5 11.5 12 4l7.5 7.5" />
      <path d="M6.5 11.5V19a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-7.5" />
    </SvgIcon>
  )
}

export function IconChat(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5.5 5h13a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-4.8L10 18.5v-3H5.5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M8.5 10.25h7" />
      <path d="M8.5 13h4.5" />
    </SvgIcon>
  )
}

export function IconSend(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4.5 4.5 20 12 4.5 19.5l3.1-7.5-3.1-7.5z" />
      <path d="M7.6 12H20" />
    </SvgIcon>
  )
}

export function IconCompass(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M10.8 14.8 11.8 9.2 16.4 10.2 15.2 15z" />
    </SvgIcon>
  )
}

export function IconData(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M6 18.5v-5" />
      <path d="M12 18.5v-9" />
      <path d="M18 18.5v-7" />
      <path d="M4.5 6.5h15" />
      <path d="M7 4.5h10" />
    </SvgIcon>
  )
}

export function IconMenu(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 7h14" />
      <path d="M5 12h14" />
      <path d="M5 17h14" />
    </SvgIcon>
  )
}

export function IconLock(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="5.5" y="11" width="13" height="9.5" rx="2" />
      <path d="M9 11V7.5a3 3 0 0 1 6 0V11" />
      <path d="M12 14.5v2.5" />
    </SvgIcon>
  )
}

export function IconBell(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M18 14.5V11a6 6 0 1 0-12 0v3.5" />
      <path d="M5.5 14.5h13" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </SvgIcon>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="10.5" cy="10.5" r="5" />
      <path d="M15 15l4.5 4.5" />
    </SvgIcon>
  )
}

export function IconBank(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 10h14" />
      <path d="M6 10v7.5" />
      <path d="M12 10v7.5" />
      <path d="M18 10v7.5" />
      <path d="M4 18.5h16" />
      <path d="M3.5 9.5 12 4l8.5 5.5" />
    </SvgIcon>
  )
}

export function IconChart(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 6v12" />
      <path d="M5 18h14" />
      <path d="M9.3 14.2 12 10.5l3 2 3.5-4.5" />
      <circle cx="12" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="8" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="9.3" cy="14.2" r="0.6" fill="currentColor" stroke="none" />
    </SvgIcon>
  )
}

export function IconSpark(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M11.5 2.5 6 13h6l-1.5 8.5L18 11.5h-6z" />
    </SvgIcon>
  )
}

export function IconUser(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="8" r="3" />
      <path d="M6.5 19.5c.7-3 3.6-5 5.5-5s4.8 2 5.5 5" />
    </SvgIcon>
  )
}
