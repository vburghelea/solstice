import { Link } from "@tanstack/react-router";
import { ExternalLink, LogIn, UserPlus } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

/**
 * Public portal page shown to unauthenticated visitors.
 * Directs them to login/signup or the public marketing site.
 */
export function PublicPortalPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Quadball Canada
          </h1>
          <p className="mt-2 text-lg text-gray-600">Members Portal</p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              This is the member management system for registered players, teams, and
              officials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Login Button */}
            <Button asChild className="w-full" size="lg">
              <Link to="/auth/login">
                <LogIn className="mr-2 h-4 w-4" />
                Log in
              </Link>
            </Button>

            {/* Sign Up Button */}
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link to="/auth/signup">
                <UserPlus className="mr-2 h-4 w-4" />
                Create an account
              </Link>
            </Button>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            {/* Marketing Site Link */}
            <div className="text-center">
              <p className="mb-3 text-sm text-gray-600">
                Looking for general information about Quadball Canada?
              </p>
              <Button asChild variant="ghost" className="text-primary">
                <a
                  href="https://quadballcanada.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit quadballcanada.ca
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Quadball Canada. All rights reserved.
        </p>
      </div>
    </div>
  );
}
