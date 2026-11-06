import { describe, it, expect } from 'vitest'
import {
  cleanEmail,
  isJunkEmail,
  isFreeMail,
  extractEmailsFromHtml,
  rankEmails,
  pickBestEmail,
  findSharedEmails,
  normalizeHost,
  decodeCfEmail,
} from './email-quality.mjs'

describe('cleanEmail', () => {
  it('lowercases and trims', () => {
    expect(cleanEmail('  Info@Example-Restaurant.COM ')).toBe('info@example-restaurant.com')
  })
  it('strips quotes, brackets, mailto: and the ?subject tail', () => {
    expect(cleanEmail('"owner@place.com"')).toBe('owner@place.com')
    expect(cleanEmail('<owner@place.com>')).toBe('owner@place.com')
    expect(cleanEmail('(owner@place.com)')).toBe('owner@place.com')
    expect(cleanEmail('MAILTO:Info@Example-Restaurant.com?subject=x')).toBe('info@example-restaurant.com')
  })
  it('strips trailing backslashes and escaped newlines leaking from JSON-in-HTML', () => {
    expect(cleanEmail('purchasingsuppliers@brinker.com\\')).toBe('purchasingsuppliers@brinker.com')
    expect(cleanEmail('kevinmoury@comcast.net\\\\n\\')).toBe('kevinmoury@comcast.net')
    expect(cleanEmail('kevinmoury@comcast.net\n')).toBe('kevinmoury@comcast.net')
    expect(cleanEmail('ikiaremysweets@yahoo.com\\')).toBe('ikiaremysweets@yahoo.com')
  })
  it('strips trailing punctuation', () => {
    expect(cleanEmail('owner@place.com.')).toBe('owner@place.com')
    expect(cleanEmail('owner@place.com,')).toBe('owner@place.com')
    expect(cleanEmail('owner@place.com;')).toBe('owner@place.com')
  })
  it('decodes HTML-entity obfuscation (Apify exports and crawled pages both carry it)', () => {
    expect(cleanEmail('&#105;nfo&#64;moct&#101;zum&#97;s&#109;e&#120;ic&#97;&#110;.&#99;&#111;m')).toBe('info@moctezumasmexican.com')
    expect(cleanEmail('info&commat;place&period;com')).toBe('info@place.com')
    expect(cleanEmail('&amp;#105;nfo&#64;x.com')).toBe('info@x.com')
  })
  it('decodes percent-encoding and bracketed [at] / [dot]', () => {
    expect(cleanEmail('info%40place.com')).toBe('info@place.com')
    expect(cleanEmail('info [at] place [dot] com')).toBe('info@place.com')
    expect(cleanEmail('info(at)place.com')).toBe('info@place.com')
  })
  it('cuts text glued onto the TLD', () => {
    expect(cleanEmail('kevin@comcast.netPhone')).toBe('kevin@comcast.net')
    expect(cleanEmail('info@place.comcontact')).toBe('info@place.com')
    expect(cleanEmail('info@place.orgmenu')).toBe('info@place.org')
  })
  it('keeps real TLDs that start with a generic one', () => {
    expect(cleanEmail('hi@place.company')).toBe('hi@place.company')
    expect(cleanEmail('hi@place.coffee')).toBe('hi@place.coffee')
    expect(cleanEmail('julie@heartandsoul.cafe')).toBe('julie@heartandsoul.cafe')
  })
  it('returns null for anything that is not an address', () => {
    const bad = ['', '   ', ',', '([^\\', 'foo', 'foo@', '@bar.com', 'foo@bar', 'foo@@bar.com', 'a..b@x.com', 'a.@x.com', 'foo@-bar.com', 'foo@bar..com', 'foo@bar.c0m', null, undefined, 42]
    for (const b of bad) expect(cleanEmail(b), String(b)).toBeNull()
  })
  it('accepts a 64-char local part and rejects 65', () => {
    expect(cleanEmail('a'.repeat(64) + '@x.com')).toBe('a'.repeat(64) + '@x.com')
    expect(cleanEmail('a'.repeat(65) + '@x.com')).toBeNull()
  })
})

describe('isJunkEmail', () => {
  const junk = [
    // the four real bounces + what was still queued on 2026-11-04
    'mail@gmail.com', 'mymail@mailservice.com', 'impallari@gmail.com', 'example@mysite.com', 'example@mail.com',
    'info@mysite.com', 'hi@mystore.com', 'hello@site.com', 'team@latofonts.com', 'astigma@astigmatic.com',
    'hello@rfuenzalida.com', 'hello@readymag.com', 'pressable@alias-solutions.com', 'support@webador.com',
    'purchasingsuppliers@brinker.com', 'membership@bn.com', 'bnevents@bn.com', 'press@starbucks.com',
    'c01149@chilis.com', 'ma.2693.holyokei91@chipotle.com', 'adasilva@110grill.com',
    // placeholders
    'email@email.com', 'youremail@yourdomain.com', 'your-email@example.com', 'name@domain.com', 'user@website.com',
    'test@test.com', 'test123@gmail.com', 'firstname@company.com', 'someone@somewhere.com', 'john.doe@gmail.com',
    'jsmith@gmail.com', 'jane_doe@outlook.com', 'info@mail.com', 'email@yourcompany.com', 'me@mysite.com',
    'contact@yoursite.com', 'x@foo.test', 'x@site.invalid', 'x@mail.localhost',
    // vendors / fonts / platforms / social
    'filler@godaddy.com', 'bugs@sentry.io', 'x@wixpress.com', 'help@squarespace.com', 'x@fonts.googleapis.com',
    'x@fonts.com', 'support@wpengine.com', 'hello@kinsta.com', 'x@getflywheel.com', 'x@typekit.com',
    'x@hubspot.com', 'x@mailchimp.com', 'x@constantcontact.com', 'x@getbento.com', 'x@toasttab.com',
    'x@popmenu.com', 'x@clover.com', 'x@doordash.com', 'x@grubhub.com', 'x@ubereats.com', 'x@yelp.com',
    'x@google.com', 'x@facebook.com', 'x@w3.org', 'x@schema.org', 'advertising@restaurantwebx.com',
    'info@allhungry.com', 'help@us.orderspoon.com',
    // font-licence credits already sitting in scraped rows
    'typesetit@att.net', 'info@ndiscovered.com', 'julieta.ulanovsky@gmail.com', 'vern@newtypography.co.uk',
    'eben@eyebytes.com', 'micah@micahrich.com', 'sebastian@aldusleaf.org', 'info@indiantypefoundry.com',
    // asset names + no-reply styles
    'logo@2x.png', 'icon@3x.svg', 'hero@2x.webp', 'x@y.js', 'x@y.css', 'noreply@place.com', 'no-reply@place.com',
    'donotreply@place.com', 'mailer-daemon@place.com', 'postmaster@place.com', 'abuse@place.com',
    'webmaster@place.com', 'bounces+123@place.com',
  ]
  it.each(junk)('flags %s', (e) => expect(isJunkEmail(e)).toBe(true))

  const real = [
    'fronteragrillchicopee@gmail.com', 'tlsfoods@comcast.net', 'thefarmershouse@hotmail.com', 'x@verizon.net',
    'donniekimll23@gmail.com', 'cocorays@outlook.com', 'thenewlanding@aol.com', 'x@icloud.com', 'kaizen479@yahoo.com',
    'ikiaremysweets@yahoo.com', 'joe@mail.com', 'info@example-restaurant.com', 'info@condesarestaurant.com',
    'help@palmerrestaurant.com', 'ciao@larosasnewburyport.com', 'info@aprilsrestaurants.com', 'info@northernrg.com',
    'pizzafactoryamesbury@ftorder.online', 'julie@heartandsoul.cafe', 'bar@thedoublebull.com', 'events@lilysboston.com',
    'media@losteria.com', 'lugnutzcafe@marcotteford.com', 'info@springfieldmuseums.org', 'info@mysite-cafe.com',
    'support@thecormorantnbpt.com', 'x@squarespace-pizza.com', 'orders@pizzaorder.com', 'haverhill@barrio-tacos.com',
  ]
  it.each(real)('keeps %s', (e) => expect(isJunkEmail(e)).toBe(false))

  it('treats garbage as junk', () => {
    expect(isJunkEmail('')).toBe(true)
    expect(isJunkEmail('nope')).toBe(true)
    expect(isJunkEmail(null)).toBe(true)
  })
})

describe('isFreeMail', () => {
  it('knows consumer domains', () => {
    expect(isFreeMail('x@gmail.com')).toBe(true)
    expect(isFreeMail('x@comcast.net')).toBe(true)
    expect(isFreeMail('x@place.com')).toBe(false)
  })
})

describe('extractEmailsFromHtml', () => {
  it('takes mailto: links, normalising case and dropping the ?subject tail', () => {
    const html = '<p>Write us: <a href="mailto:Info@Example-Restaurant.com?subject=x">email</a></p>'
    expect(extractEmailsFromHtml(html)).toEqual(['info@example-restaurant.com'])
  })
  it('takes addresses from visible text', () => {
    expect(extractEmailsFromHtml('<div class="x">Reservations: owner@place.com or call</div>')).toEqual(['owner@place.com'])
  })
  it('excludes a font-licence email inside a <style> block', () => {
    const html = `<style>/* Copyright (c) 2010-2014 by tyPoland Lukasz Dziedzic (team@latofonts.com) */ @font-face{font-family:Lato}
      /* Raleway: Pablo Impallari (impallari@gmail.com) */</style><p>Hi: info@place.com</p>`
    expect(extractEmailsFromHtml(html)).toEqual(['info@place.com'])
  })
  it('excludes even a non-junk-looking address that only lives in a <style> block', () => {
    expect(extractEmailsFromHtml('<style>/* by Jane (jane@typefoundry-x.com) */</style><p>none</p>')).toEqual([])
  })
  it('excludes attribute values: placeholder="example@mysite.com", data-*, content=', () => {
    const html =
      '<input type="email" placeholder="example@mysite.com"><input placeholder="you@yourrestaurant.com">' +
      '<meta name="author" content="dev@agency-x.com"><div data-email="owner@legit-x.com">Call us</div>'
    expect(extractEmailsFromHtml(html)).toEqual([])
  })
  it('excludes JSON-LD inside <script> ("email":"x@y.com\\n")', () => {
    const html =
      '<script type="application/ld+json">{"@type":"Restaurant","email":"owner@place.com\\n"}</script>' +
      '<script>var cfg={email:"dev@agency-x.com"}</script><p>Menu</p>'
    expect(extractEmailsFromHtml(html)).toEqual([])
  })
  it('cleans a trailing backslash / escaped newline on a visible address', () => {
    expect(extractEmailsFromHtml('<p>kevinmoury@comcast.net\\\\n\\</p><p>other@place.com\\</p>')).toEqual([
      'kevinmoury@comcast.net',
      'other@place.com',
    ])
  })
  it('decodes entity-obfuscated and [at]-obfuscated visible text', () => {
    const html =
      '<span>&#105;nfo&#64;moct&#101;zum&#97;s&#109;e&#120;ic&#97;&#110;.&#99;&#111;m</span> <span>owner [at] place [dot] com</span>'
    expect(extractEmailsFromHtml(html)).toEqual(['info@moctezumasmexican.com', 'owner@place.com'])
  })
  it('decodes Cloudflare email-protection', () => {
    const key = 0x5a
    const hex = [key, ...'info@place.com'.split('').map((c) => c.charCodeAt(0) ^ key)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    expect(decodeCfEmail(hex)).toBe('info@place.com')
    const html = `<a href="/cdn-cgi/l/email-protection#${hex}"><span class="__cf_email__" data-cfemail="${hex}">[email protected]</span></a>`
    expect(extractEmailsFromHtml(html)).toEqual(['info@place.com'])
  })
  it('dedupes across mailto + text; ignores comments, <noscript>, <template>, an unterminated <script>', () => {
    const html = `<!-- contact: hidden@agency-x.com --><noscript>ns@agency-x.com</noscript><template>t@agency-x.com</template>
      <a href='mailto:INFO@place.com'>INFO@place.com</a> <a href=mailto:info@place.com,events@place.com>x</a>
      <script>var a = "unterminated@agency-x.com"`
    expect(extractEmailsFromHtml(html)).toEqual(['info@place.com', 'events@place.com'])
  })
  it('drops junk and asset names found in text', () => {
    expect(extractEmailsFromHtml('<p>mail@gmail.com logo@2x.png noreply@place.com real@place.com</p>')).toEqual(['real@place.com'])
  })
  it('handles non-strings and empty input', () => {
    expect(extractEmailsFromHtml(null)).toEqual([])
    expect(extractEmailsFromHtml('')).toEqual([])
  })
})

describe('rankEmails / pickBestEmail', () => {
  it("prefers the business's own domain, info@ first within it, low-value roles last", () => {
    const r = rankEmails(
      ['tony@tacosmexico.com', 'kyle.laires@gmail.com', 'info@tacosmexico.com', 'events@tacosmexico.com'],
      'http://www.tacosmexico.com/',
    )
    expect(r).toEqual(['info@tacosmexico.com', 'tony@tacosmexico.com', 'events@tacosmexico.com', 'kyle.laires@gmail.com'])
  })
  it('then business-like free-mail, then a generic role elsewhere, then the rest', () => {
    const r = rankEmails(['kyle.laires@gmail.com', 'info@northernrg.com', 'fronteragrillchicopee@gmail.com'], 'https://frontera2go.com/')
    expect(r).toEqual(['fronteragrillchicopee@gmail.com', 'info@northernrg.com', 'kyle.laires@gmail.com'])
  })
  it('recognises a business-like local part via the host, the business name or a trade word', () => {
    expect(pickBestEmail(['someone.else@gmail.com', 'miltsdiner@gmail.com'], 'https://www.mainstreettavernmonson.com/')).toBe('miltsdiner@gmail.com')
    expect(pickBestEmail(['jane.smith9@gmail.com', 'kaizen479@yahoo.com'], 'http://www.kaizen479.com/')).toBe('kaizen479@yahoo.com')
    expect(
      pickBestEmail(['jane.smith9@gmail.com', 'pointbreeze2020@gmail.com'], 'http://www.pointbreezeonwebsterlake.com/', {
        businessName: 'Point Breeze Restaurant',
      }),
    ).toBe('pointbreeze2020@gmail.com')
    expect(pickBestEmail(['jane.smith9@gmail.com', 's.seafood376@gmail.com'], 'http://sturbridgeseafood.squarespace.com/')).toBe('s.seafood376@gmail.com')
  })
  it('is deterministic, dedupes, and copes with no website', () => {
    expect(rankEmails(['b@place.com', 'a@place.com', 'a@place.com'], 'place.com')).toEqual(['a@place.com', 'b@place.com'])
    expect(pickBestEmail([], 'place.com')).toBeNull()
    expect(pickBestEmail(['owner@place.com'])).toBe('owner@place.com')
  })
  it('treats a sub-domain site and a parent-domain email as the same business', () => {
    expect(pickBestEmail(['info@aprilsrestaurants.com', 'x@gmail.com'], 'https://aprilsrestaurants.com/aprils-lynn/')).toBe('info@aprilsrestaurants.com')
    expect(pickBestEmail(['haverhill@barrio-tacos.com', 'x@gmail.com'], 'https://barrio-tacos.com/locations/haverhill/')).toBe('haverhill@barrio-tacos.com')
    expect(pickBestEmail(['john@redskitchenandtavern.com', 'x@gmail.com'], 'http://peabody.redskitchenandtavern.com/')).toBe('john@redskitchenandtavern.com')
  })
})

describe('findSharedEmails', () => {
  it('flags an email sitting on 2+ unrelated businesses (agency / template vendor)', () => {
    const rows = [
      { email: 'pressable@alias-solutions.com', placeId: 'p1', website: 'https://buenoysano.com/', name: 'Bueno y Sano' },
      { email: 'pressable@alias-solutions.com', placeId: 'p2', website: 'https://other-place.com/', name: 'Other Place' },
      { email: 'pressable@alias-solutions.com', placeId: 'p3', website: 'https://third.com/', name: 'Third Cafe' },
      { email: 'impallari@gmail.com', placeId: 'p4', website: 'https://russoslakeside.com/', name: "Russo's Lakeside" },
      { email: 'impallari@gmail.com', placeId: 'p5', website: 'https://some-grill.com/', name: 'Some Grill' },
      { email: 'unique@place.com', placeId: 'p6', website: 'https://place.com/', name: 'Place' },
    ]
    expect([...findSharedEmails(rows)].sort()).toEqual(['impallari@gmail.com', 'pressable@alias-solutions.com'])
  })
  it('does not flag one brand with several Google listings on one site', () => {
    const rows = [
      { email: 'info@tacoslupita.com', placeId: 'a', website: 'https://www.tacoslupita.com/', name: 'Tacos Lupita Lynn' },
      { email: 'info@tacoslupita.com', placeId: 'b', website: 'https://www.tacoslupita.com/', name: 'Tacos Lupita Salem' },
      { email: 'info@tacoslupita.com', placeId: 'c', website: 'https://www.tacoslupita.com/', name: 'Tacos Lupita Haverhill' },
    ]
    expect(findSharedEmails(rows).size).toBe(0)
  })
  it('does not flag a restaurant group whose own domain is one of the sites', () => {
    const rows = [
      { email: 'info@aprilsrestaurants.com', placeId: 'a', website: 'https://aprilsrestaurants.com/aprils-lynn/' },
      { email: 'info@aprilsrestaurants.com', placeId: 'b', website: 'https://aprils-peabody.com/' },
    ]
    expect(findSharedEmails(rows).size).toBe(0)
  })
  it('does not flag listings that share the brand word even on different sites', () => {
    const rows = [
      { email: 'hello@brand-group.com', placeId: 'a', website: 'https://frontera-chicopee.com/', name: 'Frontera Grill' },
      { email: 'hello@brand-group.com', placeId: 'b', website: 'https://frontera-springfield.com/', name: 'Frontera Grill of Springfield' },
    ]
    expect(findSharedEmails(rows).size).toBe(0)
  })
  it('a generic first word (pizza / cafe) is not a brand match', () => {
    const rows = [
      { email: 'dev@agency-x.com', placeId: 'a', website: 'https://one.com/', name: 'Pizza Palace' },
      { email: 'dev@agency-x.com', placeId: 'b', website: 'https://two.com/', name: 'Pizza Corner' },
    ]
    expect(findSharedEmails(rows).has('dev@agency-x.com')).toBe(true)
  })
  it('falls back to the website host without a placeId; ignores rows with neither; same place twice is not shared', () => {
    expect(
      findSharedEmails([
        { email: 'dev@agency-x.com', website: 'https://one.com/' },
        { email: 'dev@agency-x.com', website: 'https://two.com/' },
      ]).has('dev@agency-x.com'),
    ).toBe(true)
    expect(findSharedEmails([{ email: 'dev@agency-x.com' }, { email: 'dev@agency-x.com' }]).size).toBe(0)
    expect(findSharedEmails([{ email: 'x@y.com', placeId: 'a' }, { email: 'x@y.com', placeId: 'a' }]).size).toBe(0)
  })
  it('is case-insensitive on the email and tolerates garbage rows', () => {
    const rows = [
      { email: 'Dev@Agency-X.com', placeId: 'a', website: 'https://one.com/' },
      { email: 'dev@agency-x.com', placeId: 'b', website: 'https://two.com/' },
      null,
      { email: null, placeId: 'c' },
    ]
    expect(findSharedEmails(rows).has('dev@agency-x.com')).toBe(true)
  })
})

describe('normalizeHost', () => {
  it('strips scheme, www, path, query, port', () => {
    expect(normalizeHost('https://www.Place.com:443/menu?x=1#top')).toBe('place.com')
    expect(normalizeHost('place.com/')).toBe('place.com')
    expect(normalizeHost('')).toBe('')
    expect(normalizeHost(undefined)).toBe('')
  })
})
