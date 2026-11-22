---
id: home
blueprint: page
title: Home
template: default
updated_by: 51bd3274-9a37-4575-92af-62d9d9fe9812
updated_at: 1795337829
seo_noindex: false
seo_nofollow: false
seo_canonical_type: entry
sitemap_change_frequency: weekly
sitemap_priority: 0.5
page_builder:
  -
    id: promo-home
    type: promo_banner
    enabled: true
    heading: 'Small upgrades, beautifully made'
    text: 'Discover thoughtful everyday goods designed to bring a little more ease, color, and character to your routine.'
    background_color: '#C9232C'
    text_color: white
    background_overlay: 50
    background_image: csm_brushless-motor-autonomous-shopping-cart-viras-header_16f636df5c.webp
  -
    id: products-home
    type: products
    enabled: true
    eyebrow: 'Shop the edit'
    heading: 'Everyday essentials'
    intro: 'Useful objects, considered details, and good things for daily life.'
    product_source: api
    api_url: 'https://dummyjson.com/products?limit=20'
---
