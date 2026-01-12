import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { getCurrentUser, setCurrentUser, syncProfile } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface ProfileDialogProps {
    onProfileUpdate?: () => void;
}

export const ProfileDialog = ({ onProfileUpdate }: ProfileDialogProps) => {
    const [open, setOpen] = useState(false);
    const user = getCurrentUser();
    const [formData, setFormData] = useState({
        name: user.name === 'Book Club Member' ? '' : user.name,
        email: user.email,
    });
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setCurrentUser(formData);
            await syncProfile(formData);
            setOpen(false);
            toast({ title: "Profile updated!" });
            if (onProfileUpdate) onProfileUpdate();
            // Reload page to refresh admin status across components
            window.location.reload();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: "Error updating profile",
                description: "Please try again later.",
                variant: "destructive"
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="gap-2 px-3">
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">{user.name === 'Book Club Member' ? 'Set Profile' : user.name}</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>User Profile</DialogTitle>
                    <DialogDescription>
                        Enter your name and email. Your email is used to recognize if you are an administrator.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Alex"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="alex@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
