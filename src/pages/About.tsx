import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted">
      {/* Nav bar */}
      <div className="sticky top-0 z-50 bg-popover/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-display text-xl text-primary">The Tiny Times</h1>
        <Button onClick={() => navigate('/')} variant="ghost" size="sm" className="font-body">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-4xl text-primary mb-10">About</h1>

        <section className="mb-10">
          <h2 className="font-display text-2xl text-foreground mb-3">The Story</h2>
          <p className="font-body text-base text-foreground/80 leading-relaxed">
            Dan, a dad in the Sunset, wanted to create a daily, printable "Tiny Times" for his son.
            He reached out to Josh, another dad in the Sunset, and they collaborated on this site –
            bringing it to life for their kids and other families in the neighborhood.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl text-foreground mb-3">What's Next</h2>
          <p className="font-body text-base text-foreground/80 leading-relaxed mb-4">
            We are working on creating a free, personalized, daily email newsletter so families in
            the Sunset can easily print this out for their little ones!
          </p>
          <p className="font-body text-base text-foreground/80 leading-relaxed mb-4">
            We're planning to create ~400 unique illustrations about San Francisco for the drawing
            page, which can then be paired with the daily SF news story.
          </p>
          <p className="font-body text-base text-foreground/80 leading-relaxed">
            We're also planning to help this spread to other neighborhoods. We're thinking this will
            happen through customization on this site, open-sourcing the{' '}
            <a
              href="https://github.com/The-Relational-Technology-Project/tiny-times"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              code
            </a>{' '}
            and helping neighbors create their own remixes on this project through the{' '}
            <a
              href="https://studio.relationaltechproject.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Relational Tech Studio
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-3">Get in Touch</h2>
          <p className="font-body text-base text-foreground/80 leading-relaxed">
            Questions or ideas for us? Email us at{' '}
            <a
              href="mailto:humans@relationaltechproject.org"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              humans@relationaltechproject.org
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
