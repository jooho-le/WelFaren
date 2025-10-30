import { IconHome } from './icons'

export default function HomeButton({ navigate }: { navigate: (p: string) => void }) {
  return (
    <button
      className="fab-home"
      aria-label="홈으로 이동"
      onClick={() => navigate('/')}
      title="홈으로"
    >
      <span className="fab-icon" aria-hidden>
        <IconHome size={20} />
      </span>
    </button>
  )
}
