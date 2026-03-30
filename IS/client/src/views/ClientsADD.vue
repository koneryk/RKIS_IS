<template>
    <div>
        <div>
            <p>Введите наимекнование</p>
            <input type="text" name="NAME" id="NAME_cl">
            <p>Введите ИНН</p>
            <input type="number" name="INN" id="INN_cl">
            <p>Введите ОГРН</p>
            <input type="text" name="OGRN" id="OGRN_cl">
            <p>Введите Адрес</p>
            <input type="text" name="ADRESS" id="ADRESS_cl">
            <p>Введите Телефон</p>
            <input type="number" name="TELEPHONE" id="TELEPHONE_cl">

            <button @click="addclients">Добавить клиента</button>
        </div>
    </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';

const route = useRoute();
const router = useRouter();

const clients = ref([]);
const products = ref([]);
const loading = ref(true);
const error = ref('');
const submitting = ref(false);
const name_cl = ref('')





/*
1. Нужно взять id клинта от основной страницы(не правильно, я думал это редактрование),
2. потом сделать get запрос по пути 'Clients', получить данные, и 
3. дать возможность отредактировать клиента, 
4. далее сохранить в каком то обекте и 
5.отправить patch запрос. 
*/

</script>