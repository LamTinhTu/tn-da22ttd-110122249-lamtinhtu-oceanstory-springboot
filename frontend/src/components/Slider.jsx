import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Slider({ banners }) {
  return (
    <div className="rounded-2xl bg-white/80 p-3 shadow-soft">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        loop
        className="h-[460px] rounded-xl"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div className="relative h-full overflow-hidden rounded-xl">
              <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 max-w-[75%] text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-pink-100">Nổi bật</p>
                <h2 className="mt-1 text-xl font-bold">{banner.title}</h2>
                <p className="mt-1 text-sm text-pink-50/90">{banner.subtitle}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
