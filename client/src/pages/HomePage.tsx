import { usePrograms } from "@/hooks/use-programs";
import { Link } from "wouter";
import { Loader2, Headphones, ArrowRight, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const { data: programs, isLoading } = usePrograms();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <header className="mb-16 md:mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-6 text-accent">
              <Headphones className="w-6 h-6" />
              <span className="text-sm font-bold tracking-widest uppercase">Binaural Entrainment</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-medium leading-tight mb-8 text-glow">
              Reclaim your <br />
              <span className="text-primary/90 italic">natural rhythms</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl font-light">
              Scientifically designed frequencies to guide your brainwaves from waking beta states down to deep restorative delta sleep.
            </p>
          </motion.div>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {programs?.map((program) => (
              <motion.div key={program.id} variants={item}>
                <Link href={`/program/${program.id}`} className="block group">
                  <div className="glass-panel rounded-3xl p-8 h-full transition-all duration-500 hover:bg-white/5 hover:scale-[1.02] border border-white/5 group-hover:border-primary/30 relative overflow-hidden">
                    
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-8">
                        <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-primary/20 transition-colors">
                          <PlayCircle className="w-8 h-8 text-primary" />
                        </div>
                        {program.isDefault && (
                          <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase border border-accent/20">
                            Recommended
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-2xl font-display mb-3 group-hover:text-primary transition-colors">
                        {program.name}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                        {program.description}
                      </p>
                      
                      <div className="flex items-center text-primary text-sm font-bold tracking-wide group-hover:translate-x-1 transition-transform">
                        START SESSION <ArrowRight className="ml-2 w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
