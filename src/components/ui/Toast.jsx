export default function Toast({ message }) {
  if (!message) return null
  return (
    <div className="toast-wrap">
      <div className="toast">{message}</div>
    </div>
  )
}