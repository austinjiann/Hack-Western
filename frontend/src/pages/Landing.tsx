import { Theme } from "@radix-ui/themes";
import Navbar from './LandingComponents/Navbar';
import Hero from './LandingComponents/Hero';
import DemoSection from './LandingComponents/DemoSection';
import Footer from './LandingComponents/Footer';

function Landing() {
    return (
        <Theme>
            <div className="min-h-screen relative bg-white">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                
                <div className="relative z-10">
                    <Navbar />
                    <Hero />
                    <DemoSection />
                    <Footer />
                </div>
            </div>
        </Theme>
    )
}

export default Landing;
