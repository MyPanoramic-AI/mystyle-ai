# Future beauty image generation

Beauty Studio can later ask a specialist for hairstyle, hair-colour, makeup, nail, and occasion ideas, and can coordinate those ideas with a saved outfit. That specialist is not connected.

`server/api/src/domain/beautyBoundary.ts` exports `beautyGenerationBoundary`. It records:

- External transmission is disabled.
- Image generation is `not_connected`.
- Facial analysis is off.
- Customer photographs are not accepted.
- Child or dependent photographs are not accepted.

The AI coordinator still returns beauty as `not_connected`. Beauty preferences and saved looks are not added to the stylist prompt. `GET /api/integrations` still reports that no beauty model is called.

## Before any preview is enabled

A future adult-only preview would need all of the following, and none of them is enabled now:

- A separate consent control for sending one adult photograph to a named image provider.
- A provider whose commercial terms allow the intended use.
- A privacy and retention review, including where the image is processed and how soon it is deleted.
- A quality review with a fixed set of adult test images.
- A budget ceiling and a hard stop when that ceiling is reached.
- A customer control to delete the preview and the stored source image.
- Confirmation that dependent and child photographs cannot be selected.
- No claim that the preview is a medical match or a guaranteed result on the customer.

Until that review is approved, Beauty Studio stores styling selections only. It does not generate, alter, or analyse a photograph.
