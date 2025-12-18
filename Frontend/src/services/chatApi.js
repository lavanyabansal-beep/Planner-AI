export async function sendMessage(message) {
  const res = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })

  const data = await res.json()
  return data.reply || 'No response'
}
