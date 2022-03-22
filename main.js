import * as THREE from './assets/js/three.module.js'
import { OrbitControls } from './assets/js/OrbitControls.js'

new class {
	constructor() {
		this.init_three()
			.init_helpers()
			.init_controls()
			.main()
		this.render().update()
	}
	update(time = 0) {
		requestAnimationFrame((time) => this.update(time))
		Object.values(this.objects).map(obj => { if (obj.update) obj.update(time / 10000) })

		if (this.camera_obj) {
			if (this.controls) {
				this.controls.target = this.camera_obj.position
				this.controls.update()
			} else
				this.camera.lookAt(...Object.values(this.camera_obj.position))
		}

		this.render()
		return this
	}
	main() {
		this.add_starts()

		let e_m = new THREE.Object3D // Earth moon group
		this.scene.add(e_m)

		this.objects = {
			'moon': this.add_moon(e_m),
			'earth': this.add_earth(e_m),
			'sun': this.add_sun(this.scene),
		}

		this.init_dom()

		this.camera_follow(this.objects.earth)
	}
	camera_follow(obj) {
		if (typeof obj !== 'object') {
			obj = this.objects[obj] || false
			if (!obj) return obj
		}
		this.camera_obj = obj
	}

	add_sun(scene) {

		let star = new THREE.Mesh(
			new THREE.SphereGeometry(3, 32, 32),
			new THREE.MeshBasicMaterial({
				map: new THREE.TextureLoader().load('./assets/img/sun.jpg')
			})
		);
		let sun = new THREE.Object3D
		sun.position.x -= 100

		sun.add(star)

		sun.add(new THREE.PointLight(0xffffff, 1, 2000))

		sun.update = (time) => {
			star.rotation.y += 0.0003
			sun.position.x = Math.cos(time / 10) * 100
			sun.position.z = Math.sin(time / 10) * 100
		}


		if (scene) scene.add(sun)
		return sun

	}

	add_earth(scene) {
		let planet = new THREE.Mesh(
			new THREE.SphereGeometry(0.5, 32, 32),
			new THREE.MeshLambertMaterial({
				map: new THREE.TextureLoader().load('./assets/img/earth.jpg'),
			})
		);
		let earth = new THREE.Object3D
		earth.add(planet)
		planet.rotation.z = 0.235
		earth.update = (time) => {
			planet.rotation.y -= 0.01
		}

		if (scene) scene.add(earth)
		return earth
	}
	add_moon(scene) {
		let real_moon = new THREE.Mesh(
			new THREE.SphereGeometry(0.1, 32, 32),
			new THREE.MeshLambertMaterial({
				map: new THREE.TextureLoader().load('./assets/img/moon.jpg'),
			})
		);
		let moon = new THREE.Object3D
		moon.add(real_moon)

		moon.update = (time) => {
			moon.position.x = Math.cos(time)
			moon.position.z = Math.sin(time)
			real_moon.rotation.y -= 0.001
		}
		if (scene) scene.add(moon)
		return moon
	}

	add_starts() {
		let addStar = () => {
			const geometry = new THREE.SphereGeometry(0.15, 24, 24)
			const material = new THREE.MeshStandardMaterial({ color: 0xffffff })
			const star = new THREE.Mesh(geometry, material)
			const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(600))
			star.position.set(x, y, z)
			this.scene.add(star)
		}

		Array(200).fill().map(addStar)
	}

	//init
	init_dom() {
		setTimeout(() => {
			//init menu
			document.querySelector('#menu').innerHTML = [
				Object.keys(this.objects).map(key => `<a href="#${key}"><button>${key}</button></a>`).join('&nbsp;&nbsp;'),
				`<button id="grid" id="grid">show grid</button>`


			].join('<br>')

			document.querySelector('#grid').onclick = () => {
				if (this.helpers_on) {
					this.helpers.map(helper => this.scene.remove(helper))
					this.helpers_on = false
					document.querySelector('#grid').innerHTML = 'show grid'
				} else {
					this.helpers.map(helper => this.scene.add(helper))
					this.helpers_on = true
					document.querySelector('#grid').innerHTML = 'hide grid'
				}
			}

			window.addEventListener("hashchange", () => {
				this.camera_follow(location.hash.replace('#', ''))
			})

			this.camera_follow(location.hash.replace('#', ''))
		})
	}

	init_three() {
		this.camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 1, 3000)
		this.camera.position.set(0, 20, -20)

		this.scene = new THREE.Scene()
		this.camera.lookAt(this.scene.position)


		this.scene.add(new THREE.AmbientLight(0xffffff, 0.01));

		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		document.body.appendChild(this.renderer.domElement)
		window.addEventListener('resize', () => this.on_window_resize())
		return this
	}
	on_window_resize() {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		return this.render()
	}
	init_helpers() {
		this.helpers = [
			new THREE.GridHelper(200, 50),
			new THREE.AxesHelper(200, 50)
		]
		return this
	}
	init_controls() {
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		return this
	}
	render() {
		this.renderer.render(this.scene, this.camera)
		return this
	}
}