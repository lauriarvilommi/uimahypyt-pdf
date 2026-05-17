# Uimahyppyjen tekniikka ja mekaniikka – PDF-sisällysluettelo

Tämä repository kokoaa yhteen uimahyppyjen tekniikkaa, biomekaniikkaa, ponnahduslaudan mekaniikkaa, rotaatiota, kierteitä ja veteentuloa käsitteleviä avoimesti saatavilla olevia PDF-lähteitä.

Projektin pääidea on yksinkertainen: `index.html` toimii kauniina selaimessa avattavana sisällysluettelona, joka linkittää paikallisesti tallennettuihin PDF-tiedostoihin. Jokaiselle lähteelle on mukana myös alkuperäinen verkkolinkki, jotta lähde voidaan tarkistaa myöhemmin.

## Sisältö

Repository on tarkoitettu henkilökohtaiseksi tai valmennukselliseksi lähdearkistoksi. Se ei ole uusi tutkimusjulkaisu, vaan järjestetty hakemisto PDF-lähteille.

Lähteet on ryhmitelty teemoihin:

- ponnahduslauta, ponnistus ja simulointi
- mittaus, palaute ja oppiminen
- ilmavaihe, rotaatio ja kierteet
- veteentulo, splash/rip ja hydrodynamiikka
- bibliografiat ja jatkohaku

## Tiedostorakenne

Suositeltu rakenne:

```text
.
└── docs/
    └── README.md
    ├── index.html
    └── pdf/
        ├── a_new_model_of_the_springboard_in_diving_(2004).pdf
        ├── computer_simulation_of_the_takeoff_in_springboard_diving_(2005).pdf
        ├── variability_and_control_in_springboard_diving_(2017).pdf
        └── ...
```

`index.html` olettaa oletuksena, että PDF-tiedostot ovat `pdf/`-kansiossa.

## Käyttö

Avaa `index.html` selaimessa.

Sivulla voi:

- hakea lähteitä otsikon, vuoden, kategorian, tagien tai kuvauksen perusteella
- hypätä suoraan eri aihealueisiin
- avata paikallisesti tallennetun PDF:n
- avata alkuperäisen verkkolähteen
- tarkistaa, millä nimellä PDF-tiedosto pitäisi tallentaa

## PDF-tiedostojen nimeäminen

HTML-sivu muodostaa paikallisen PDF-linkin automaattisesti lähteen otsikosta ja vuosiluvusta.

Muoto on:

```text
<otsikko>_(yyyy).pdf
```

Tiedostonimi normalisoidaan näin:

- kaikki kirjaimet pieniksi
- sanat erotetaan alaviivalla
- erikoismerkit poistetaan tai muunnetaan alaviivoiksi
- vuosiluku lisätään sulkeisiin ennen `.pdf`-päätettä

Esimerkki:

```text
A New Model of the Springboard in Diving
```

muuttuu muotoon:

```text
a_new_model_of_the_springboard_in_diving_(2004).pdf
```

## Kansion juuren vaihtaminen

HTML-tiedoston JavaScriptin alussa on muuttuja:

```js
let FOLDER_ROOT = "./pdf/";
```

Jos PDF:t ovat samassa kansiossa kuin HTML-tiedosto, käytä:

```js
let FOLDER_ROOT = "./";
```

Jos PDF:t ovat alikansiossa `pdf`, käytä:

```js
let FOLDER_ROOT = "./pdf/";
```

Jos käytät tiedostoja vain omalla koneellasi, voit antaa myös paikallisen polun, esimerkiksi Windowsissa:

```js
let FOLDER_ROOT = "C:/Users/<kayttaja>/Documents/uimahyppy/pdf/";
```

HTML-sivulla on myös kenttä, johon kansion juuren voi kirjoittaa selaimessa. Valinta tallennetaan selaimen `localStorage`-muistiin, joten sitä ei tarvitse vaihtaa joka kerta uudestaan samalla selaimella.

## GitHub Pages -käyttö

Jos julkaiset sivun GitHub Pagesin kautta, turvallisin tapa on pitää PDF:t repossa esimerkiksi `pdf/`-kansiossa ja käyttää suhteellista polkua:

```js
let FOLDER_ROOT = "./pdf/";
```

Paikalliset tiedostopolut kuten `C:/Users/...` eivät toimi muille käyttäjille GitHub Pagesissa, koska ne viittaavat vain sinun omaan tietokoneeseesi.

Jos et halua lisätä PDF-tiedostoja repositoryyn, voit käyttää paikallisia tiedostopolkuja vain omalla koneellasi tai muuttaa `FOLDER_ROOT`-arvoksi jonkin julkisen PDF-kansion URL-osoitteen.

## Uuden lähteen lisääminen

Lisää uusi lähde `index.html`-tiedoston `sources`-taulukkoon.

Esimerkkimuoto:

```js
{
  title: "Example Source Title",
  year: 2026,
  category: "Ponnahduslauta, ponnistus ja simulointi",
  tags: ["springboard", "biomekaniikka", "simulaatio"],
  url: "https://example.com/example-source.pdf",
  summary: "Lyhyt kuvaus siitä, mitä lähde käsittelee ja miksi se on hyödyllinen."
}
```

Kun lisäät uuden lähteen:

1. Lisää lähde `sources`-taulukkoon.
2. Tallenna PDF oikealla tiedostonimellä `pdf/`-kansioon.
3. Avaa `index.html` ja tarkista, että paikallinen PDF-linkki toimii.
4. Tarkista myös, että alkuperäinen verkkolinkki toimii.

## Lähteiden luonne

Tämä projekti sisältää viitteitä avoimesti saatavilla oleviin PDF-lähteisiin. Osa lähteistä on tieteellisiä artikkeleita, osa konferenssipapereita, osa väitöskirjoja ja osa bibliografioita.

Kaikki lähteet eivät välttämättä ole saman tasoisia tutkimusnäytöltään. Käytännön valmennuksessa kannattaa erottaa toisistaan:

- vertaisarvioidut artikkelit
- väitöskirjat
- konferenssipaperit
- tekniset raportit
- opetusmateriaalit
- bibliografiat ja hakemistot

## Tekijänoikeudet ja lisenssit

Tämä repository ei omista linkitettyjen tutkimusten tai PDF-tiedostojen tekijänoikeuksia.

Jos lisäät PDF:t repositoryyn, tarkista ensin jokaisen lähteen lisenssi ja käyttöehdot. Vaikka PDF olisi avoimesti ladattavissa, sen uudelleenjakeluun voi liittyä ehtoja.

Jos lisenssi on epäselvä, turvallisempi vaihtoehto on säilyttää repossa vain:

- `index.html`
- `README.md`
- lähteen alkuperäinen verkkolinkki

ja pitää PDF-tiedostot omalla koneella.

## Tarkoitus

Tämän arkiston tarkoitus on tehdä uimahyppyjen biomekaniikkaa ja tekniikkaa käsittelevästä materiaalista helpommin selattavaa, haettavaa ja käytännön harjoittelun tai tutkimisen kannalta käyttökelpoista.

Painopiste ei ole yksittäisten vinkkien keräämisessä, vaan siinä, että ponnistuksen, rotaation, kierteen, ilmalennon ja veteentulon taustalla oleva mekaniikka voidaan hahmottaa järjestelmällisemmin.

## Huomautus

Lähdeluetteloa kannattaa pitää elävänä. Jos löydät paremman version samasta PDF:stä, suoremman latauslinkin, oikeamman vuosiluvun tai tarkemman kuvauksen, päivitä `sources`-taulukko ja tallenna PDF samalla nimeämislogiikalla.
