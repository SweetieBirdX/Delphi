export default function LandingTest() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Delphi NFT Ticketing
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Landing page test
        </p>
        <a 
          href="/dashboard"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
