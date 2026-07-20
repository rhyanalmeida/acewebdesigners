# Real testimonials — Google Business Profile

**Source of truth.** Pulled 2026-07-20 from the live Google Business Profile.
Profile: `https://www.google.com/maps/place/Ace+Web+Designers/` (place id `0xad742ddaf4fd4307:0xeb30864a6eee77ea`)

**Rating: 5.0 · 6 reviews.** The site's "Rated 5.0 / 5 on Google" claim is **true** — it is simply
unsourced, which is why it reads as invented. Add the review count and link to the profile.

Every quote below is verbatim. **Nothing on the site may be attributed to a person who did not say it.**

---

### 1. Pedro Dipre-Rojas — Conuco Takeout (best one; lead with it)
*a year ago · posted as "Conuco Takeout"*

> "Hello. I'm Pedro Dipre-Rojas, the owner of Conuco Restaurant Takeout, and Ace Web Designers built an
> amazing website for my business! Working with Rhyan and Valerie was a great experience. They are super
> professional and delivered a website that truly represents my restaurant. Their communication is
> excellent, and this made the process smooth from start to finish. If you need a website, I highly
> recommend Ace Web Designers. They'll make sure you get exactly what you need for your business."

Live site: https://conucotakeout.com/ — we already have a screenshot in `src/Work.tsx`.

### 2. Aaron Brown
*11 months ago · 7 reviews*

> "Ryan and his team did an outstanding job on my website. It looks spectacular. He helped me setup DNS
> settings and protect my customers. Also optimized everything so now I get a TON of leads coming in just
> with SEO… Blown away by what they accomplished - 10/10"

### 3. Yolanda Quesada
*edited 10 months ago · 3 reviews, 1 photo*

> "I needed website. I saw in Facebook. And felt. I could do great. He did it. And people are going to my
> website. Thank you. I will continue to work with this company Ace web Designers"

Note: quote verbatim, including the broken English. **Do not clean it up** — the imperfection is the
proof of authenticity. Polished testimonials are what read as fake.

### 4. Philosophy Try
*10 months ago*

> "I love my philosophy site I highly recommend Valerie and Rhyan, very professional communication and
> Valerie made my social media explode"

### 5. Hank Lin
*9 months ago · 9 reviews, 3 photos*

> "Great service and excellent website design"

### 6. Francisco Oliveira
*10 months ago*

> "Great experience! Highly recommend!"

---

## What has to be deleted

`src/pages/Home.tsx:53-86` — all four entries are fabricated: invented names, invented quotes,
invented metrics, illustrated with Unsplash stock headshots.

```
Mike Chen · Hot Pot One · "40% increase in online orders"
Maria Rodriguez · Conuco Takeout · "35% more takeout"
John Dunn · Dunn Construction · "3× more qualified leads"
Sarah Thompson · Thompson Fitness · "50% more bookings"
```

The Conuco entry is the clearest illustration of the problem: it invents **"Maria Rodriguez"** for a
client whose real owner, **Pedro Dipre-Rojas**, had already left a long, glowing, signed review. We
fabricated a worse testimonial than the real one we already had.

Also remove the placeholder names `'Local Plumbing Co.'` and `'Trade Specialist'` in
`src/LandingContractors.tsx`.

This is not only a design issue. Fabricated endorsements with specific performance claims are an FTC
problem (16 CFR Part 255), and the invented metrics are unsubstantiated. **Take them down before the
redesign, not as part of it.**

## What we gained

Two named humans the site currently hides: **Rhyan** and **Valerie** — both named repeatedly by real
clients, Valerie specifically credited for social media results. The current site names nobody and
says "we". Three separate reviewers praise **communication**, which Google itself surfaces as a
keyword theme on the profile. That is the differentiator to lead with, and it is externally verified.
