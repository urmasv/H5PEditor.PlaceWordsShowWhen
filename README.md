# H5PEditor.PlaceWordsShowWhen

*Eesti keeles · [English](#english)*

Sisutüübi [H5P.OrderWords](https://github.com/urmasv/H5P.OrderWords) („Paiguta sõnad“) redaktori abiteek. Ei ole iseseisvalt käivitatav (`runnable: 0`).

Teek põhineb H5P teegil [H5PEditor.ShowWhen](https://github.com/h5p/h5p-editor-show-when) (autor fnoks, MIT).

**Näidisfailid:** https://urmasvessin.ee/testid/h5p/h5p-sisutuup-place-words-paiguta-sonad/

## Mida see teeb

- Näitab või peidab redaktori välju teiste väljade väärtuse järgi (vidin `showWhen`). Näiteks rippmenüü seaded on näha ainult rippmenüü režiimis ja reapiltide loend ainult sõnade järjestamisel.
- Toetab valiku-, teegi- ja tõeväärtusvälju. Reeglid saab ühendada tingimustega „ja“ või „või“, ning välja leiab ka pesastatud rühmadest.
- Nummerdab loendi elemendid („1. rida“, „2. rida“ jne) ning uuendab numbreid lisamisel, kustutamisel ja ümberjärjestamisel.
- Peidab loendi juurest H5P „Collapse all content“ nupud, mis mõnes redaktoris (nt Lumi) kuvatakse valesti. Muutus kehtib ainult selle vidina sees.

## Sõltuvus

Kasutatakse `H5P.OrderWords` `library.json` → `editorDependencies` kaudu.

Hoidla juur on teegi juur, ehitamist pole vaja.

## Litsents

MIT, vt [LICENSE](LICENSE).

## Autor

UrmasV

---

<a id="english"></a>

# H5PEditor.PlaceWordsShowWhen (English)

*[Eesti keeles](#h5peditorplacewordsshowwhen) · English*

Editor helper library for the content type [H5P.OrderWords](https://github.com/urmasv/H5P.OrderWords) ("Place Words"). It is not runnable on its own (`runnable: 0`).

Based on the H5P library [H5PEditor.ShowWhen](https://github.com/h5p/h5p-editor-show-when) (author fnoks, MIT).

**Sample files:** https://urmasvessin.ee/testid/h5p/h5p-sisutuup-place-words-paiguta-sonad/

## What it does

- Shows or hides editor fields depending on the values of other fields (widget `showWhen`). For example, the dropdown settings are only visible in dropdown mode, and the line images list only in word ordering.
- Supports select, library and boolean fields. Rules can be combined with "and" or "or", and fields are also found inside nested groups.
- Numbers list items ("1. rida", "2. rida", etc.) and updates the numbers when items are added, removed or reordered.
- Hides H5P's "Collapse all content" buttons next to the list, because some editors (e.g. Lumi) render them incorrectly. The change applies only inside this widget.

## Dependency

Used through `H5P.OrderWords` `library.json` → `editorDependencies`.

The repository root is the library root; no build step is needed.

## License

MIT, see [LICENSE](LICENSE).

## Author

UrmasV
