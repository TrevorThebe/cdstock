export default function TestPage() {
    return (
        <div>
            <h1>Environment Variables Test</h1>
            <pre>
                {JSON.stringify({
                    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
                    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + '...'
                }, null, 2)}
            </pre>
        </div>
    )
}