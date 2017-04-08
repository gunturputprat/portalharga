import { Component } from '@angular/core';
import { NavController, NavParams, ToastController, LoadingController } from 'ionic-angular';
import { NgForm } from '@angular/forms';
import { AuthHttp } from 'angular2-jwt';
import { UserData } from '../../../providers/user-data';
import { Geolocation} from 'ionic-native';
import * as moment from 'moment';
import 'moment/locale/pt-br';
/*
  Generated class for the EditStatusProduksi page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
declare var google: any;
@Component({
  selector: 'page-edit-status-produksi',
  templateUrl: 'edit-status-produksi.html'
})
export class EditStatusProduksiPage {
  submitted: boolean = false;
  id: string;
  produksi:{id?: string, komoditas_id?: string, alamat?: string, jumlah?: string, satuan?: string, waktu_panen?: any, keterangan?: string} = {};
  lokasi:{lat?: number, lng?: number}={};
  inputAlamat: string;
  dataKomoditas = [];
  useCurrentLocation: boolean;
  useCurrentLocationColor: string;
  useManualLocationColor: string;
  loading: any;

  constructor(
  	public navCtrl: NavController,
    public toastCtrl: ToastController, 
    public authHttp: AuthHttp, 
  	public navParams: NavParams,
    public userData: UserData,
    public loadCtrl: LoadingController) {
  	let data = navParams.data;
  	this.produksi.id = data.produksi_id;
  	this.produksi.alamat = data.alamat;
  	this.inputAlamat = data.alamat;
  	this.produksi.jumlah = data.jumlah;
  	this.produksi.waktu_panen = moment(data.date_panen).format('YYYY-MM-DD');
  	this.produksi.keterangan = data.keterangan;
  	this.lokasi.lat = data.latitude;
  	this.lokasi.lng = data.longitude;
  	this.produksi.satuan = data.satuan;
  }

  ionViewWillEnter() {
    this.getKomoditas();
    this.userData.getId().then((value) => {
      this.id = value;
    });
    this.chooseLocation(1);
  }

  getKomoditas() {
      this.authHttp.get(this.userData.BASE_URL+'komoditas/get').subscribe(res => {
        let response = res.json();
        if(response.status == 200) {
          this.dataKomoditas = response.data;
        } else if(response.status == 204){
          this.dataKomoditas = [];
        }
      }, err => { 
          this.showError(err);
      });
  }
  changeKomoditas(idKomoditas){
     for(let data of this.dataKomoditas){
       if(data.komoditas_id == idKomoditas) {
         this.produksi.satuan = '( '+data.satuan+' )';
         break;
       }
     }
  }
  chooseLocation(target){
    if(target == 1) {
      this.useCurrentLocation = false;
      this.useCurrentLocationColor = "dark";
      this.useManualLocationColor = "default";
    } else if(target == 0) {
      this.getCurrentLocation();
      this.useCurrentLocation = true;
      this.useCurrentLocationColor = "default";
      this.useManualLocationColor = "dark";
    }
  }
  getLatitudeLongitude(address){
    let geocoder = new google.maps.Geocoder();
    geocoder.geocode({'address': address},(results, status)=> {
      if(status=='OK') {
        let lokasi = results[0];
        this.produksi.alamat = address;
        this.lokasi.lat = lokasi.geometry.location.lat();
        this.lokasi.lng = lokasi.geometry.location.lng();
        this.updateStatusProduksi();
      } else{
        this.loading.dismiss();
        this.showAlert("Tidak dapat menemukan lokasi anda");
      }
    });
  }
  getAddress(){
    let geocoder = new google.maps.Geocoder();
    let latlng = {lat: this.lokasi.lat, lng: this.lokasi.lng};
    this.produksi.alamat = "";
    geocoder.geocode({'location': latlng},(results, status)=> {
      this.loading.dismiss();
      if(status=='OK') {
        this.produksi.alamat = results[0].formatted_address;
      } else{
        this.showAlert("Tidak dapat menemukan alamat Anda");
      }
    });
  }
  getCurrentLocation(){
    this.loading = this.loadCtrl.create({
        content: 'Tunggu sebentar...'
    });
    this.loading.present();
    Geolocation.getCurrentPosition().then((position) => {
      this.lokasi.lng = position.coords.longitude;
      this.lokasi.lat = position.coords.latitude;
      this.getAddress();
    }, (err) => {
      this.loading.dismiss();
      console.log(err);
    });
  }
  updateStatusProduksi(){
    let date = new Date(this.produksi.waktu_panen).getTime();
    this.submitted = false;
      let input = JSON.stringify({
      	produksi_id: this.produksi.id,
        komoditas_id: this.produksi.komoditas_id,
        alamat: this.produksi.alamat,
        latitude: this.lokasi.lat,
        longitude: this.lokasi.lng,
        jumlah: this.produksi.jumlah, 
        keterangan: this.produksi.keterangan,
        date_panen: date
      });
      this.authHttp.post(this.userData.BASE_URL+"produksi/update",input).subscribe(data => {
         this.loading.dismiss();
         let response = data.json();
         if(response.status == '200') {
            this.navCtrl.popToRoot();
            this.showAlert("Status produksi anda telah diperbarui");
         }
         
      }, err => {
        this.loading.dismiss();
        this.showError(err);
      });
  }
  submit(form: NgForm) {
    this.submitted = true;
    if (form.valid) {
	  this.loading = this.loadCtrl.create({
	      content: 'Tunggu sebentar...'
	  });
	  this.loading.present();
      if(this.useCurrentLocation) {
        this.updateStatusProduksi();
      } else{
        this.getLatitudeLongitude(this.inputAlamat);
      }
    }
  }
  showError(err: any){  
    err.status==0? 
    this.showAlert("Tidak ada koneksi. Cek kembali sambungan Internet perangkat Anda"):
    this.showAlert("Tidak dapat menyambungkan ke server. Mohon muat kembali halaman ini");
  }
  showAlert(message: string){
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000
    });
    toast.present();
  }

}
