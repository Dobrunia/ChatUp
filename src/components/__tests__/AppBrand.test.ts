import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppBrand from '../AppBrand.vue'

describe('AppBrand', () => {
  it('should render the ChatUp text', () => {
    const wrapper = mount(AppBrand)
    expect(wrapper.text()).toContain('ChatUp')
  })

  it('should render an SVG icon', () => {
    const wrapper = mount(AppBrand)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('should apply class app-brand--lg by default', () => {
    const wrapper = mount(AppBrand)
    expect(wrapper.classes()).toContain('app-brand--lg')
  })

  it('should apply class app-brand--sm when size="sm"', () => {
    const wrapper = mount(AppBrand, { props: { size: 'sm' } })
    expect(wrapper.classes()).toContain('app-brand--sm')
  })

  it('should apply class app-brand--lg when size="lg"', () => {
    const wrapper = mount(AppBrand, { props: { size: 'lg' } })
    expect(wrapper.classes()).toContain('app-brand--lg')
  })

  it('should render SVG with width 24 when size="sm"', () => {
    const wrapper = mount(AppBrand, { props: { size: 'sm' } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('24')
    expect(svg.attributes('height')).toBe('24')
  })

  it('should render SVG with width 36 when size="lg"', () => {
    const wrapper = mount(AppBrand, { props: { size: 'lg' } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('36')
    expect(svg.attributes('height')).toBe('36')
  })

  it('should render SVG with width 36 by default (no size prop)', () => {
    const wrapper = mount(AppBrand)
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('36')
  })

  it('should contain the chat bubble path in SVG', () => {
    const wrapper = mount(AppBrand)
    expect(wrapper.find('path').exists()).toBe(true)
  })

  it('should contain a rect element inside SVG', () => {
    const wrapper = mount(AppBrand)
    expect(wrapper.find('rect').exists()).toBe(true)
  })

  it('should have app-brand as root class', () => {
    const wrapper = mount(AppBrand)
    expect(wrapper.classes()).toContain('app-brand')
  })
})
