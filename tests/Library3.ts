import getPI from './Library1'
import get2PI from './Library2'

export default function get3PI(): number {
	return getPI() + get2PI()
}