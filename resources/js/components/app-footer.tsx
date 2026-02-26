import { Link } from '@inertiajs/react';
import { Github, ExternalLink } from 'lucide-react';
import HytaleModdingLogo from './hytale-modding-logo';

export default function AppFooter() {
    return (
        <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-12">
            <div className="container max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo and Description */}
                    <div className="col-span-1 md:col-span-2">
                        <HytaleModdingLogo variant="banner" size="lg" />
                        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                            The premier documentation platform for Hytale modding.
                            Create, organize, and share your mod documentation with the community.
                        </p>
                        <div className="flex items-center space-x-4 mt-4">
                            <a
                                href="https://github.com/HytaleModding"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Github className="h-4 w-4 mr-1" />
                                GitHub
                                <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    href="/dashboard"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/mods"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    My Mods
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/docs"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/settings/profile"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Settings
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Community */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Community</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a
                                    href="https://hytale.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                                >
                                    Hytale Official
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://discord.gg/hytale"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                                >
                                    Discord
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/HytaleModding/wiki"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                                >
                                    Contribute
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
                    <p>
                        © {new Date().getFullYear()} HytaleModding. Built with passion for the Hytale community.
                    </p>
                    <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                        <Link
                            href="/privacy"
                            className="hover:text-foreground transition-colors"
                        >
                            Privacy
                        </Link>
                        <Link
                            href="/terms"
                            className="hover:text-foreground transition-colors"
                        >
                            Terms
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
