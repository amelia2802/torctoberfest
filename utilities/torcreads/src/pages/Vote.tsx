import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ThumbsUp, Trophy, CheckCircle2, Swords, History, Theater, Heart, Rocket, Sparkles, Ghost, Skull, RefreshCcw } from "lucide-react";
import { getVotingOptions, saveVotingOption, voteForOption, clearVotingOptions, getCurrentUser, getGenreVotes, voteForGenre, resetGenreVotes, type VotingOption, type GenreVote } from "@/lib/storage";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const Vote = () => {
  const [options, setOptions] = useState<VotingOption[]>([]);
  const [genreVotes, setGenreVotes] = useState<GenreVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    bookTitle: "",
    author: "",
    suggestedBy: getCurrentUser(),
    isMember: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    setLoading(true);
    try {
      const [bookData, genreData] = await Promise.all([
        getVotingOptions(),
        getGenreVotes()
      ]);
      setOptions(bookData);
      setGenreVotes(genreData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error loading options",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newOption: VotingOption = {
        ...formData,
        suggestedBy: getCurrentUser(),
        votes: 0,
      };

      await saveVotingOption(newOption);
      await loadOptions();

      setOpen(false);
      setFormData({
        bookTitle: "",
        author: "",
        suggestedBy: getCurrentUser(),
        isMember: false
      });
      toast({ title: "Book suggestion added!" });
    } catch (error) {
      console.error('Error saving suggestion:', error);
      toast({
        title: "Error adding suggestion",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleVote = async (id: string) => {
    try {
      await voteForOption(id);
      await loadOptions();
      toast({ title: "Vote recorded!" });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error recording vote",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleClearVotes = async () => {
    if (!window.confirm('Are you sure you want to reset all book votes? This will remove all suggested books.')) {
      return;
    }

    try {
      await clearVotingOptions();
      await loadOptions();
      toast({ title: "Book voting reset for new month" });
    } catch (error) {
      console.error('Error clearing votes:', error);
      toast({
        title: "Error resetting book votes",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleGenreVote = async (genreName: string) => {
    try {
      await voteForGenre(genreName);
      const updatedGenreVotes = await getGenreVotes();
      setGenreVotes(updatedGenreVotes);
      toast({ title: `Vote added for ${genreName}!` });
    } catch (error) {
      console.error('Error voting for genre:', error);
      toast({
        title: "Error recording vote",
        variant: "destructive"
      });
    }
  };

  const handleResetGenreVotes = async () => {
    if (!window.confirm('Are you sure you want to reset all genre votes?')) {
      return;
    }

    try {
      await resetGenreVotes();
      const updatedGenreVotes = await getGenreVotes();
      setGenreVotes(updatedGenreVotes);
      toast({ title: "Genre votes reset!" });
    } catch (error) {
      console.error('Error resetting genre votes:', error);
      toast({
        title: "Error resetting genre votes",
        variant: "destructive"
      });
    }
  };

  const getGenreIcon = (name: string) => {
    switch (name) {
      case "Action/Adventure": return <Swords className="w-5 h-5" />;
      case "Historical Fiction": return <History className="w-5 h-5" />;
      case "Drama / Literary Fiction": return <Theater className="w-5 h-5" />;
      case "Romance": return <Heart className="w-5 h-5 text-rose-500" />;
      case "Sci-Fi": return <Rocket className="w-5 h-5 text-blue-400" />;
      case "Fantasy": return <Sparkles className="w-5 h-5 text-purple-400" />;
      case "Mystery / Thriller": return <Ghost className="w-5 h-5 text-gray-400" />;
      case "Horror": return <Skull className="w-5 h-5 text-red-500" />;
      default: return <Plus className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-muted mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading voting options...</p>
          </div>
        </main>
      </div>
    );
  }

  const sortedOptions = [...options].sort((a, b) => b.votes - a.votes);
  const winner = sortedOptions[0];

  const sortedGenres = [...genreVotes].sort((a, b) => b.votes - a.votes);
  const leadingGenre = sortedGenres[0]?.votes > 0 ? sortedGenres[0] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-light mb-2">Monthly Vote</h1>
            <p className="text-muted-foreground">Choose our next community read</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Suggest Book
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Suggest a Book</DialogTitle>
                  <DialogDescription>Nominate a book for the community to vote on</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bookTitle">Book Title</Label>
                      <Input
                        id="bookTitle"
                        value={formData.bookTitle}
                        onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="author">Author</Label>
                      <Input
                        id="author"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="suggestedBy">Your Name</Label>
                      <Input
                        id="suggestedBy"
                        value={formData.suggestedBy}
                        onChange={(e) => setFormData({ ...formData, suggestedBy: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2 py-2">
                      <Checkbox
                        id="isMember"
                        checked={formData.isMember}
                        onCheckedChange={(checked) => setFormData({ ...formData, isMember: checked as boolean })}
                      />
                      <Label
                        htmlFor="isMember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I am a Torc Book Club Member
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Submit Suggestion</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            {options.length > 0 && (
              <Button variant="outline" onClick={handleClearVotes}>
                Reset Books
              </Button>
            )}
            <Button variant="outline" onClick={handleResetGenreVotes} className="gap-2">
              <RefreshCcw className="w-4 h-4" />
              Reset Genres
            </Button>
          </div>
        </div>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-light">Next Month's Genre</h2>
          </div>

          {leadingGenre && (
            <Card className="mb-8 border-primary bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-primary">
                  <Trophy className="w-5 h-5" />
                  <span className="text-sm font-medium uppercase tracking-wider">Leading Genre</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-background rounded-full border-2 border-primary/20 shadow-sm">
                    {getGenreIcon(leadingGenre.name)}
                  </div>
                  <div>
                    <h3 className="text-3xl font-light">{leadingGenre.name}</h3>
                    <p className="text-muted-foreground">
                      {leadingGenre.votes} {leadingGenre.votes === 1 ? 'vote' : 'votes'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {genreVotes.map((genre) => (
              <Card key={genre.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {getGenreIcon(genre.name)}
                      </div>
                      <span className="font-medium">{genre.name}</span>
                    </div>
                    <span className="text-xl font-light text-primary">{genre.votes}</span>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full gap-2"
                    onClick={() => handleGenreVote(genre.name)}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Vote
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-light">Book Nominations</h2>
        </div>

        {winner && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                <CardTitle className="font-normal">Current Leader</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-2xl font-light mb-1">{winner.bookTitle}</h3>
              <p className="text-muted-foreground mb-2">by {winner.author}</p>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>{winner.votes} {winner.votes === 1 ? 'vote' : 'votes'} • Suggested by {winner.suggestedBy}</span>
                {winner.isMember && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-primary/10" />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedOptions.map((option) => (
            <Card key={option.id}>
              <CardHeader>
                <CardTitle className="font-normal">{option.bookTitle}</CardTitle>
                <CardDescription>by {option.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-light text-primary">{option.votes}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.votes === 1 ? 'vote' : 'votes'}
                    </p>
                  </div>
                  <Button onClick={() => handleVote(option.id!)} className="gap-2">
                    <ThumbsUp className="w-4 h-4" />
                    Vote
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 mt-4">
                  <p className="text-xs text-muted-foreground">
                    Suggested by {option.suggestedBy}
                  </p>
                  {option.isMember && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-primary/10" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {options.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-muted mb-4" />
            <p className="text-muted-foreground">No suggestions yet. Be the first to suggest a book!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Vote;