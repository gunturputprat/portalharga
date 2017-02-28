import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';

import { NavController,ToastController,LoadingController } from 'ionic-angular';
import { Http,Headers,RequestOptions } from '@angular/http';

import { SignupPage } from '../signup/signup';
import { TabsPage } from '../tabs/tabs';
import { UserData } from '../../providers/user-data';


@Component({
  selector: 'page-user',
  templateUrl: 'login.html'
})
export class LoginPage {
  login: {username?: string, password?: string} = {};
  submitted = false;
  headers = new Headers({ 'Content-Type': 'application/json'});
  options = new RequestOptions({ headers: this.headers});

  constructor(
    public navCtrl: NavController, 
    public http: Http,
    public toastCtrl: ToastController,
    public loadCtrl: LoadingController,
    public userData: UserData) { }

  onLogin(form: NgForm) {
    this.submitted = true;
    let loading = this.loadCtrl.create({
        content: 'Tunggu sebentar...'
    });
    loading.present();

    if (form.valid) {
      let input = JSON.stringify({
        username: this.login.username, 
        password: this.login.password
      });
      this.http.post(this.userData.BASE_URL+"api/auth",input,this.options).subscribe(data => {
         let response = data.json();
         loading.dismiss();
         if(response.status == '200') {
           this.userData.login(response.data);
           this.userData.setToken(response.token);
           this.navCtrl.setRoot(TabsPage);
         }
         this.showToast(response.message);
         console.log(response.message);
         console.log(data);
      });
    }
  }
  onSignup() {
    this.navCtrl.push(SignupPage);
  }

  showToast(val){
    let toast = this.toastCtrl.create({
      message: val,
      duration: 3500
    });
    toast.present();
  };
}
