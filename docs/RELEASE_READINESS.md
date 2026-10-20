# Release readiness

Date: 20 October 2026.

MyStyle AI is not ready for a commercial launch. This review separates what a developer can exercise locally from what still needs an external service, a legal decision, or production hosting.

## Ready for a controlled local technical test

These paths worked in the isolated browser run or in the automated suites on 20 October 2026:

- Adult registration, session restore across reload, sign-out, and sign-in.
- Native rejection of an invalid email and an in-page rejection of a password shorter than 12 characters.
- An eight-step onboarding walk using Skip, without importing the demonstration family names.
- A wardrobe piece, a family profile, a family event plan, a hairstyle save, and a combined beauty look for one account.
- A second account not seeing those wardrobe, family, and beauty names.
- A mock stylist reply that is labelled as a demonstration, restored after reload, and removed by New Session.
- Shop and Try On copy that identifies demonstration data and inactive generation.
- API isolation for accounts, media, wardrobe, family, beauty, and stylist conversations.
- Live model calls remaining blocked when the provider is mock, live mode is false, and the budget is zero.

The local test still has the open browser steps in `CUSTOMER_JOURNEY_TEST_MATRIX.md`. A controlled internal test should use fictional adults, temporary data, and no paid provider.

## Requires external AI validation

- OpenAI response quality, safety, and cost on real customer questions.
- Gemini, if it is kept as a fallback.
- FASHN image quality, failure handling, and photograph retention.
- Beauty and try-on generation. Both are visibly inactive and were not called.

## Requires retailer agreements

- Every current shop price and store name is demonstration data.
- The shopping lab can import a local mock feed. It has no verified South African retailer connection.
- The application must not tell a customer that stock or price was checked.

## Requires legal and privacy review

- A POPIA notice, recorded consent, and an operator agreement for any model provider.
- A decision on where conversation text and photographs are stored.
- Image licensing for editorial and catalogue photographs.
- Account export, deletion, and a retention job.
- Rules for dependent profiles. Dependents must not become accounts and their details must not be sent to a model.

## Requires subscription billing

- Credits and paid plans are not granted by the API.
- There is no payment provider, invoice, or cancellation flow.
- Membership screens were not part of this browser pass.

## Requires production hosting and security work

- HTTPS, the `Secure` cookie flag, and a reviewed public origin list.
- Backups of the SQLite database and private media.
- Secret storage outside the repository. The client bundle from this build did not contain the scanned key prefixes.
- Email verification and password recovery.
- Security headers and a production dependency review.
- The 909.60 kB script and the large editorial images need a loading plan before public traffic.

## Decision

Do not deploy this revision as a public or paid service. Do not enable live OpenAI, Gemini, FASHN, or retailer calls in order to close the remaining QA steps. The next useful step is to finish the untested browser journeys against the same isolated local stack.
