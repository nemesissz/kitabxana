const newsData = [
    {
        id: 1,
        title: "Yeni futbol sezonu başladı",
        content:
            "Futbol sezonu büyük bir heyecanla başladı. Takımlar yeni transferlerle güçlendi.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "sport",
        date: "2024-06-01",
    },
    {
        id: 2,
        title: "Ekonomi büyüme rakamları açıklandı",
        content:
            "Türkiye ekonomisi yılın ilk çeyreğinde %4 büyüdü. Uzmanlar olumlu yorumladı.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "economy",
        date: "2024-06-02",
    },
    {
        id: 3,
        title: "Sağlık Bakanlığı yeni açıklama yaptı",
        content: "Sağlık Bakanlığı, grip vakalarında artış olduğunu duyurdu.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "health",
        date: "2024-06-03",
    },
    {
        id: 4,
        title: "Teknoloji fuarı İstanbul'da düzenlendi",
        content: "Dünyanın önde gelen teknoloji firmaları İstanbul'da buluştu.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "technology",
        date: "2024-06-04",
    },
    {
        id: 5,
        title: "Sanat galerisi yeni sergi açtı",
        content: "Modern sanat eserleri sanatseverlerle buluştu.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "art",
        date: "2024-06-05",
    },
    {
        id: 6,
        title: "Basketbol liginde sürpriz sonuç",
        content: "Favori takım beklenmedik şekilde mağlup oldu.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "sport",
        date: "2024-06-06",
    },
    {
        id: 7,
        title: "Döviz kurlarında dalgalanma",
        content: "Dolar ve Euro'da ani yükseliş yaşandı.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "economy",
        date: "2024-06-07",
    },
    {
        id: 8,
        title: "Yeni aşı çalışmaları başladı",
        content: "Bilim insanları yeni bir aşı üzerinde çalışıyor.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "health",
        date: "2024-06-08",
    },
    {
        id: 9,
        title: "Yapay zeka konferansı düzenlendi",
        content: "Yapay zeka alanında son gelişmeler konuşuldu.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "technology",
        date: "2024-06-09",
    },
    {
        id: 10,
        title: "Müzik festivali büyük ilgi gördü",
        content: "Ünlü sanatçılar sahne aldı, binlerce kişi katıldı.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "art",
        date: "2024-06-10",
    },
    {
        id: 11,
        title: "Voleybol turnuvası sona erdi",
        content: "Şampiyon takım kupasını kaldırdı.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "sport",
        date: "2024-06-11",
    },
    {
        id: 12,
        title: "Enflasyon oranı açıklandı",
        content: "Enflasyon geçen aya göre yükseldi.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "economy",
        date: "2024-06-12",
    },
    {
        id: 13,
        title: "Yeni hastane hizmete açıldı",
        content: "Bölgedeki sağlık hizmetleri güçlendi.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "health",
        date: "2024-06-13",
    },
    {
        id: 14,
        title: "Mobil uygulama rekor indirme aldı",
        content: "Yeni çıkan uygulama milyonlarca kez indirildi.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "technology",
        date: "2024-06-14",
    },
    {
        id: 15,
        title: "Tiyatro oyunu sahnelendi",
        content: "Ünlü oyuncuların performansı beğeni topladı.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "art",
        date: "2024-06-15",
    },
    {
        id: 16,
        title: "Atletizm yarışları başladı",
        content: "Sporcular madalya için yarışıyor.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "sport",
        date: "2024-06-16",
    },
    {
        id: 17,
        title: "Borsa günü yükselişle kapattı",
        content: "Borsa İstanbul'da endeks yükseldi.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "economy",
        date: "2024-06-17",
    },
    {
        id: 18,
        title: "Sağlıklı yaşam semineri düzenlendi",
        content: "Uzmanlar sağlıklı yaşamın püf noktalarını anlattı.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "health",
        date: "2024-06-18",
    },
    {
        id: 19,
        title: "Elektrikli araçlar tanıtıldı",
        content: "Yeni nesil elektrikli araçlar fuarda sergilendi.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "technology",
        date: "2024-06-19",
    },
    {
        id: 20,
        title: "Resim yarışması sonuçlandı",
        content: "Genç sanatçılar ödüllerini aldı.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "art",
        date: "2024-06-20",
    },
    {
        id: 21,
        title: "Tenis turnuvası başladı",
        content: "Uluslararası tenis turnuvası büyük ilgi görüyor.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "sport",
        date: "2024-06-21",
    },
    {
        id: 22,
        title: "Konut fiyatları arttı",
        content: "Gayrimenkul piyasasında fiyatlar yükselişte.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "economy",
        date: "2024-06-22",
    },
    {
        id: 23,
        title: "Obeziteye karşı kampanya başlatıldı",
        content: "Sağlık Bakanlığı obeziteyle mücadele için kampanya başlattı.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "health",
        date: "2024-06-23",
    },
    {
        id: 24,
        title: "Siber güvenlik zirvesi yapıldı",
        content: "Uzmanlar siber tehditlere karşı alınacak önlemleri tartıştı.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "technology",
        date: "2024-06-24",
    },
    {
        id: 25,
        title: "Heykel sergisi açıldı",
        content: "Sanatseverler yeni heykel sergisini ziyaret etti.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "art",
        date: "2024-06-25",
    },
    {
        id: 26,
        title: "Yüzme şampiyonası düzenlendi",
        content: "Yüzücüler madalya için yarıştı.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "sport",
        date: "2024-06-26",
    },
    {
        id: 27,
        title: "İşsizlik oranı açıklandı",
        content: "İşsizlik oranı geçen yıla göre azaldı.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "economy",
        date: "2024-06-27",
    },
    {
        id: 28,
        title: "Kanser tedavisinde yeni gelişme",
        content: "Bilim insanları yeni bir tedavi yöntemi geliştirdi.",
        image:
            "https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg",
        category: "health",
        date: "2024-06-28",
    },
];

export default newsData;
