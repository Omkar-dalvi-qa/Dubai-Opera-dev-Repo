import Banner from "@/components/programs/Banner";

export default function ProgramsPage() {
  return (
    <main className="min-h-screen bg-background pt-30">
      <div
        className="relative w-full overflow-hidden bg-cover bg-center bg-no-repeat pt-30"
        style={{ backgroundImage: 'url("/logo/bglogo.avif")' }}
      >
        <Banner subtitle="WHAT'S ON" title="Tours" />
      </div>
      <div className="px-8 py-20">
        <p className="text-gray-400">Coming soon.</p>
      </div>
    </main>
  );
}
