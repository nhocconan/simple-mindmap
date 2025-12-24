import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, Share2, Smartphone, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">MindMap Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            Visualize Your Ideas
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create stunning mind maps, organize your thoughts, and share your ideas with the world. 
            Available on web and mobile.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Start Free
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="outline" className="px-8">
                Explore Maps
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="text-center p-6 rounded-xl bg-card border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Create and edit mind maps instantly with our intuitive drag-and-drop interface.
            </p>
          </div>
          <div className="text-center p-6 rounded-xl bg-card border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Sharing</h3>
            <p className="text-muted-foreground">
              Share your mind maps with friends, colleagues, or make them public for everyone.
            </p>
          </div>
          <div className="text-center p-6 rounded-xl bg-card border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Mobile Ready</h3>
            <p className="text-muted-foreground">
              Access your mind maps anywhere with our responsive design and PWA support.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold">MindMap Pro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MindMap Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
