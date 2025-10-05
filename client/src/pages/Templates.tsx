import Header from "@/components/Header";
import TemplateManager from "@/components/TemplateManager";

export default function Templates() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8DCC6] via-[#F5EFE7] to-[#E8DCC6]">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-md border-2 border-[#1B365D] p-4 sm:p-6 shadow-lg">
          <TemplateManager />
        </div>
      </main>
    </div>
  );
}
