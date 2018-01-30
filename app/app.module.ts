import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { DragDropDirectiveModule} from "angular4-drag-drop";
import { Ng2DragDropModule } from 'ng2-drag-drop';
import {HttpClientModule} from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
//import { FilterPipe } from './filter.pipe';

import { AppComponent } from './app.component';


@NgModule({
  declarations: [
    AppComponent
	//,FilterPipe
  ],
  imports: [
    BrowserModule,
	FormsModule,
	Ng2DragDropModule.forRoot(),
	HttpClientModule
	
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {

}




